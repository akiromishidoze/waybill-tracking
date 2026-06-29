package webhook

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"github.com/waybill-tracking/core-api/internal/logger"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	"go.uber.org/zap"
	"net/http"
	"time"
)

type Dispatcher struct {
	repo   *repository.WebhookRepository
	client *http.Client
}

func NewDispatcher(repo *repository.WebhookRepository) *Dispatcher {
	return &Dispatcher{
		repo: repo,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

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
		go d.send(h, body)
	}
}

func (d *Dispatcher) send(h models.Webhook, body []byte) {
	req, err := http.NewRequest(http.MethodPost, h.URL, bytes.NewReader(body))

	if err != nil {
		logger.L().Error("webhook dispatch: request error", zap.String("webhook_id", h.ID), zap.Error(err))

		return
	}

	req.Header.Set("Content-Type", "application/json")

	if h.Secret != "" {
		mac := hmac.New(sha256.New, []byte(h.Secret))
		mac.Write(body)
		sig := hex.EncodeToString(mac.Sum(nil))
		req.Header.Set("X-Webhook-Signature", sig)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		logger.L().Error("webhook dispatch: call error", zap.String("webhook_id", h.ID), zap.Error(err))

		return
	}

	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		logger.L().Warn("webhook dispatch: non-2xx response", zap.String("webhook_id", h.ID), zap.Int("status", resp.StatusCode))
	}
}
