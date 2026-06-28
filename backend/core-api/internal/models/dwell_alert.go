package models

import "time"

type DwellAlert struct {
	ID             string     `json:"id"`
	WaybillID      string     `json:"waybillId"`
	TrackingNumber string     `json:"trackingNumber"`
	Status         string     `json:"status"`
	Location       *string    `json:"location,omitempty"`
	DwellHours     float64    `json:"dwellHours"`
	ThresholdHours float64    `json:"thresholdHours"`
	AlertType      string     `json:"alertType"`
	IsResolved     bool       `json:"isResolved"`
	ResolvedAt     *time.Time `json:"resolvedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}
