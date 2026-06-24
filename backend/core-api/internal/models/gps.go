package models

import "time"

type GPSLocation struct {
	ID           string    `json:"id"`
	WaybillID    string    `json:"waybillId"`
	CourierID    *string   `json:"courierId,omitempty"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Accuracy     *float64  `json:"accuracy,omitempty"`
	Altitude     *float64  `json:"altitude,omitempty"`
	Speed        *float64  `json:"speed,omitempty"`
	Heading      *float64  `json:"heading,omitempty"`
	BatteryLevel *float64  `json:"batteryLevel,omitempty"`
	RecordedAt   time.Time `json:"recordedAt"`
	CreatedAt    time.Time `json:"createdAt"`
}

type CreateGPSLocationRequest struct {
	WaybillID    string     `json:"waybillId" binding:"required,uuid"`
	CourierID    *string    `json:"courierId,omitempty"`
	Latitude     float64    `json:"latitude" binding:"required,latitude"`
	Longitude    float64    `json:"longitude" binding:"required,longitude"`
	Accuracy     *float64   `json:"accuracy,omitempty"`
	Altitude     *float64   `json:"altitude,omitempty"`
	Speed        *float64   `json:"speed,omitempty"`
	Heading      *float64   `json:"heading,omitempty"`
	BatteryLevel *float64   `json:"batteryLevel,omitempty"`
	RecordedAt   *time.Time `json:"recordedAt,omitempty"`
}

type WaybillGPSView struct {
	ID             string    `json:"id"`
	TrackingNumber string    `json:"trackingNumber"`
	RecipientName  string    `json:"recipientName"`
	Status         string    `json:"status"`
	Origin         string    `json:"origin"`
	Destination    string    `json:"destination"`
	LastLocation   string    `json:"lastLocation"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	Speed          *float64  `json:"speed,omitempty"`
	Heading        *float64  `json:"heading,omitempty"`
	RecordedAt     time.Time `json:"recordedAt"`
	SLABreached    bool      `json:"slaBreached"`
}
