package models

import "time"

const (
	WebhookDeliveryPending = "pending"
	WebhookDeliverySuccess = "success"
	WebhookDeliveryFailed  = "failed"
	WebhookDeliveryDead    = "dead"

	WebhookMaxAttempts = 5
)

type WebhookDeliveryLog struct {
	ID             string     `json:"id"`
	WebhookID      string     `json:"webhookId"`
	Event          string     `json:"event"`
	WaybillID      string     `json:"waybillId"`
	Payload        []byte     `json:"payload"`
	Status         string     `json:"status"`
	Attempt        int        `json:"attempt"`
	MaxAttempts    int        `json:"maxAttempts"`
	NextRetryAt    *time.Time `json:"nextRetryAt,omitempty"`
	LastError      string     `json:"lastError,omitempty"`
	ResponseStatus int        `json:"responseStatus,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type WebhookDeliveryListRequest struct {
	Status string `form:"status"`
	Limit  int    `form:"limit,default=50"`
	Offset int    `form:"offset,default=0"`
}

type Webhook struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	URL       string    `json:"url"`
	Events    []string  `json:"events"`
	Secret    string    `json:"secret,omitempty"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CreateWebhookRequest struct {
	URL    string   `json:"url" binding:"required"`
	Events []string `json:"events" binding:"required,min=1"`
	Secret string   `json:"secret"`
}

type UpdateWebhookRequest struct {
	URL    string   `json:"url"`
	Events []string `json:"events"`
	Secret string   `json:"secret"`
	Active *bool    `json:"active,omitempty"`
}

type WebhookEventPayload struct {
	Event     string      `json:"event"`
	WaybillID string      `json:"waybillId"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}
