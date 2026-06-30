package models

import "time"

type AutoCommunication struct {
	ID             string     `json:"id"`
	WaybillID      *string    `json:"waybillId,omitempty"`
	TrackingNumber *string    `json:"trackingNumber,omitempty"`
	TriggerType    string     `json:"triggerType"`
	TriggerEvent   string     `json:"triggerEvent"`
	Recipient      string     `json:"recipient"`
	Channel        string     `json:"channel"`
	Status         string     `json:"status"`
	SentAt         *time.Time `json:"sentAt,omitempty"`
	ErrorMessage   *string    `json:"errorMessage,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type AutoCommunicationRule struct {
	ID              string    `json:"id"`
	Trigger         string    `json:"trigger"`
	Channel         string    `json:"channel"`
	Subject         string    `json:"subject"`
	Template        string    `json:"template"`
	SendToShipper   bool      `json:"sendToShipper"`
	SendToRecipient bool      `json:"sendToRecipient"`
	IsActive        bool      `json:"isActive"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
