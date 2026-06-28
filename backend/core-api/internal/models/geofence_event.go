package models

import "time"

type GeofenceEvent struct {
	ID             string    `json:"id"`
	WaybillID      string    `json:"waybillId"`
	TrackingNumber string    `json:"trackingNumber"`
	GeofenceID     string    `json:"geofenceId"`
	GeofenceName   string    `json:"geofenceName"`
	EventType      string    `json:"eventType"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	RecordedAt     time.Time `json:"recordedAt"`
}
