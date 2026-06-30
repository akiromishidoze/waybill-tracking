package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"

	"github.com/waybill-tracking/core-api/internal/models"
)

type Dispatcher struct {
	analyticsURL string
	apiKey       string
	client       *http.Client
}

type deliveryPayload struct {
	TrackingNumber string `json:"trackingNumber"`
	ShipperID      string `json:"shipperId"`
	RecipientName  string `json:"recipientName"`
	RecipientPhone string `json:"recipientPhone"`
	Status         string `json:"status"`
	Destination    string `json:"destination"`
	EventType      string `json:"eventType,omitempty"`
	Remark         string `json:"remark,omitempty"`
}

func NewDispatcher(analyticsURL, apiKey string) *Dispatcher {
	return &Dispatcher{
		analyticsURL: analyticsURL,
		apiKey:       apiKey,
		client:       &http.Client{Timeout: 5 * time.Second},
	}
}

func (d *Dispatcher) DispatchDeliveryNotification(ctx context.Context, wb *models.Waybill) {
	if d.analyticsURL == "" {
		return
	}

	payload := deliveryPayload{
		TrackingNumber: wb.TrackingNumber,
		ShipperID:      wb.ShipperID,
		RecipientName:  wb.RecipientName,
		RecipientPhone: wb.RecipientPhone,
		Status:         string(wb.Status),
		Destination:    wb.Destination,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		logger.L().Error("notification dispatcher: marshal error", zap.Error(err))
		return
	}

	url := fmt.Sprintf("%s/api/v1/notifications/dispatch", d.analyticsURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		logger.L().Error("notification dispatcher: build request error", zap.Error(err))
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if d.apiKey != "" {
		req.Header.Set("X-Internal-API-Key", d.apiKey)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		logger.L().Error("notification dispatcher: call error", zap.Error(err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		logger.L().Warn("notification dispatcher: non-2xx response", zap.Int("status", resp.StatusCode))
	}
}

func (d *Dispatcher) DispatchScanNotification(ctx context.Context, wb *models.Waybill, eventType, remark string) {
	if d.analyticsURL == "" {
		return
	}

	payload := deliveryPayload{
		TrackingNumber: wb.TrackingNumber,
		ShipperID:      wb.ShipperID,
		RecipientName:  wb.RecipientName,
		RecipientPhone: wb.RecipientPhone,
		Status:         string(wb.Status),
		Destination:    wb.Destination,
		EventType:      eventType,
		Remark:         remark,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		logger.L().Error("notification dispatcher: scan marshal error", zap.Error(err))
		return
	}

	url := fmt.Sprintf("%s/api/v1/notifications/dispatch", d.analyticsURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		logger.L().Error("notification dispatcher: scan build request error", zap.Error(err))
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if d.apiKey != "" {
		req.Header.Set("X-Internal-API-Key", d.apiKey)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		logger.L().Error("notification dispatcher: scan call error", zap.Error(err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		logger.L().Warn("notification dispatcher: scan non-2xx response", zap.Int("status", resp.StatusCode))
	}
}
