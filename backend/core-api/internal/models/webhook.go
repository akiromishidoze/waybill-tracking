package models

import "time"

type Webhook struct {
	ID string `json:"id"`
	UserID string `json:"userId"`
	URL string `json:"url"`
	Events []string `json:"events"`
	Secret string `json:"secret,omitempty"`
	Active bool `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CreateWebhookRequest struct {
	URL string `json:"url" binding:"required"`
	Events []string `json:"events" binding:"required,min=1"`
	Secret string `json:"secret"`
}

type UpdateWebhookRequest struct {
	URL string `json:"url"`
	Events []string `json:"events"`
	Secret string `json:"secret"`
	Active bool `json:"active"`
}

type WebhookEventPayload struct {
	Event string `json:"event"`
	WaybillID string `json:"waybillId"`
	Data interface{} `json:"data"`
	Timestamp time.Time `json:"timestamp"`
}