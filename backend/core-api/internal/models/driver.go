package models

import "time"

type DriverAssignment struct {
	ID               string     `json:"id"`
	DriverID         string     `json:"driverId"`
	DriverName       string     `json:"driverName"`
	WaybillID        string     `json:"waybillId"`
	TrackingNumber   string     `json:"trackingNumber"`
	Status           string     `json:"status"`
	RecipientName    string     `json:"recipientName"`
	RecipientAddress string     `json:"recipientAddress"`
	RecipientPhone   string     `json:"recipientPhone"`
	Origin           string     `json:"origin"`
	Destination      string     `json:"destination"`
	Notes            *string    `json:"notes,omitempty"`
	AssignedAt       time.Time  `json:"assignedAt"`
	PickedUpAt       *time.Time `json:"pickedUpAt,omitempty"`
	DeliveredAt      *time.Time `json:"deliveredAt,omitempty"`
}

type DriverScanEvent struct {
	ID             string     `json:"id"`
	DriverID       string     `json:"driverId"`
	DriverName     string     `json:"driverName"`
	WaybillID      string     `json:"waybillId"`
	TrackingNumber string     `json:"trackingNumber"`
	ScanType       string     `json:"scanType"`
	Location       string     `json:"location"`
	Latitude       *float64   `json:"latitude,omitempty"`
	Longitude      *float64   `json:"longitude,omitempty"`
	PhotoURL       *string    `json:"photoUrl,omitempty"`
	Signature      *string    `json:"signature,omitempty"`
	Remark         *string    `json:"remark,omitempty"`
	Timestamp      time.Time  `json:"timestamp"`
}

type CreateDriverAssignmentRequest struct {
	DriverID  string  `json:"driverId" binding:"required"`
	WaybillID string  `json:"waybillId" binding:"required"`
	Notes     *string `json:"notes,omitempty"`
}

type UpdateDriverAssignmentStatusRequest struct {
	Status    string   `json:"status" binding:"required"`
	ScanType  string   `json:"scanType"`
	Location  string   `json:"location"`
	Latitude  *float64 `json:"latitude,omitempty"`
	Longitude *float64 `json:"longitude,omitempty"`
	PhotoURL  *string  `json:"photoUrl,omitempty"`
	Signature *string  `json:"signature,omitempty"`
	Remark    *string  `json:"remark,omitempty"`
}
