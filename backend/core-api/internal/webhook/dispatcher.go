package webhook

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/logger"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	"go.uber.org/zap"
)

const (
	initialBackoff = 5 * time.Second
	maxBackoff     = 10 * time.Minute
)

// backoffDuration returns the delay before attempt n (0-indexed).
// Uses exponential backoff: 5s, 10s, 20s, 40s, 80s … capped at maxBackoff.
func backoffDuration(attempt int) time.Duration {
	d := time.Duration(float64(initialBackoff) * math.Pow(2, float64(attempt)))
	if d > maxBackoff {
		return maxBackoff
	}
	return d
}

type Dispatcher struct {
	repo        *repository.WebhookRepository
	deliveryRepo *repository.WebhookDeliveryRepository
	client      *http.Client
}

func NewDispatcher(repo *repository.WebhookRepository, deliveryRepo *repository.WebhookDeliveryRepository) *Dispatcher {
	return &Dispatcher{
		repo:        repo,
		deliveryRepo: deliveryRepo,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Dispatch fans out an event to all matching active webhooks.
// Each delivery is tracked in webhook_delivery_log and retried with
// exponential backoff (up to WebhookMaxAttempts times) in a goroutine.
func (d *Dispatcher) Dispatch(ctx context.Context, event string, waybillID string, data interface{}) {
	hooks, err := d.repo.ListMatchingEvents(ctx, event)
	if err != nil {
		logger.L().Error("webhook dispatch: list hooks error", zap.Error(err))
		return
	}

	payload := models.WebhookEventPayload{
		Event:     event,
		WaybillID: waybillID,
		Data:      data,
		Timestamp: time.Now(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		logger.L().Error("webhook dispatch: marshal error", zap.Error(err))
		return
	}

	for _, h := range hooks {
		delivery := &models.WebhookDeliveryLog{
			ID:          uuid.New().String(),
			WebhookID:   h.ID,
			Event:       event,
			WaybillID:   waybillID,
			Payload:     body,
			Status:      models.WebhookDeliveryPending,
			Attempt:     0,
			MaxAttempts: models.WebhookMaxAttempts,
		}
		if err := d.deliveryRepo.Create(ctx, delivery); err != nil {
			logger.L().Error("webhook dispatch: failed to create delivery log",
				zap.String("webhook_id", h.ID), zap.Error(err))
			continue
		}
		go d.sendWithRetry(h, delivery)
	}
}

// sendWithRetry attempts delivery up to MaxAttempts times with exponential backoff.
// On final failure it marks the delivery as dead (DLQ).
func (d *Dispatcher) sendWithRetry(h models.Webhook, delivery *models.WebhookDeliveryLog) {
	for delivery.Attempt < delivery.MaxAttempts {
		if delivery.Attempt > 0 {
			delay := backoffDuration(delivery.Attempt - 1)
			time.Sleep(delay)
		}

		delivery.Attempt++
		statusCode, err := d.attempt(h, delivery.Payload)
		delivery.ResponseStatus = statusCode

		if err == nil && statusCode < 300 {
			delivery.Status = models.WebhookDeliverySuccess
			delivery.LastError = ""
			d.saveDelivery(delivery)
			logger.L().Info("webhook delivered",
				zap.String("webhook_id", h.ID),
				zap.String("delivery_id", delivery.ID),
				zap.Int("attempt", delivery.Attempt),
				zap.Int("status", statusCode),
			)
			return
		}

		if err != nil {
			delivery.LastError = err.Error()
		} else {
			delivery.LastError = fmt.Sprintf("HTTP %d", statusCode)
		}

		logger.L().Warn("webhook delivery attempt failed",
			zap.String("webhook_id", h.ID),
			zap.String("delivery_id", delivery.ID),
			zap.Int("attempt", delivery.Attempt),
			zap.Int("status", statusCode),
			zap.String("error", delivery.LastError),
		)

		if delivery.Attempt < delivery.MaxAttempts {
			delivery.Status = models.WebhookDeliveryPending
			next := time.Now().Add(backoffDuration(delivery.Attempt))
			delivery.NextRetryAt = &next
		} else {
			delivery.Status = models.WebhookDeliveryDead
			delivery.NextRetryAt = nil
			logger.L().Error("webhook delivery exhausted — moved to dead-letter queue",
				zap.String("webhook_id", h.ID),
				zap.String("delivery_id", delivery.ID),
				zap.String("event", delivery.Event),
			)
		}

		d.saveDelivery(delivery)
	}
}

// attempt performs a single HTTP delivery and returns (statusCode, error).
func (d *Dispatcher) attempt(h models.Webhook, body []byte) (int, error) {
	req, err := http.NewRequest(http.MethodPost, h.URL, bytes.NewReader(body))
	if err != nil {
		return 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	if h.Secret != "" {
		mac := hmac.New(sha256.New, []byte(h.Secret))
		mac.Write(body)
		req.Header.Set("X-Webhook-Signature", hex.EncodeToString(mac.Sum(nil)))
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	return resp.StatusCode, nil
}

func (d *Dispatcher) saveDelivery(delivery *models.WebhookDeliveryLog) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := d.deliveryRepo.Update(ctx, delivery); err != nil {
		logger.L().Error("webhook dispatch: failed to update delivery log",
			zap.String("delivery_id", delivery.ID), zap.Error(err))
	}
}

// RetryDelivery resets a dead/failed delivery and re-dispatches it immediately.
func (d *Dispatcher) RetryDelivery(ctx context.Context, deliveryID string) error {
	delivery, err := d.deliveryRepo.GetByID(ctx, deliveryID)
	if err != nil {
		return fmt.Errorf("delivery not found: %w", err)
	}

	hook, err := d.repo.GetByID(ctx, delivery.WebhookID)
	if err != nil {
		return fmt.Errorf("webhook not found: %w", err)
	}

	if err := d.deliveryRepo.ResetForRetry(ctx, deliveryID); err != nil {
		return fmt.Errorf("reset failed: %w", err)
	}

	delivery.Status = models.WebhookDeliveryPending
	delivery.Attempt = 0
	delivery.MaxAttempts = models.WebhookMaxAttempts

	go d.sendWithRetry(*hook, delivery)
	return nil
}
