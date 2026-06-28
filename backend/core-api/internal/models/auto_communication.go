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
