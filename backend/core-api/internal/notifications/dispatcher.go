package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

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
		log.Printf("notification dispatcher marshal error: %v", err)
		return
	}

	url := fmt.Sprintf("%s/api/v1/notifications/dispatch", d.analyticsURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		log.Printf("notification dispatcher request error: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if d.apiKey != "" {
		req.Header.Set("X-Internal-API-Key", d.apiKey)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		log.Printf("notification dispatcher call error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		log.Printf("notification dispatcher returned status %d", resp.StatusCode)
	}
}
