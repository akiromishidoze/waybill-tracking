package models

import "time"

type Return struct {
	ID                   string     `json:"id"`
	WaybillID            string     `json:"waybillId"`
	Status               string     `json:"status"`
	Reason               string     `json:"reason"`
	Carrier              *string    `json:"carrier"`
	Notes                *string    `json:"notes"`
	ReturnTrackingNumber *string    `json:"returnTrackingNumber"`
	RequestedAt          time.Time  `json:"requestedAt"`
	CompletedAt          *time.Time `json:"completedAt"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

type InitiateReturnRequest struct {
	Reason  string  `json:"reason" binding:"required"`
	Carrier string  `json:"carrier"`
	Notes   string  `json:"notes"`
}

type UpdateReturnStatusRequest struct {
	Status               string `json:"status" binding:"required"`
	ReturnTrackingNumber string `json:"returnTrackingNumber"`
	Notes                string `json:"notes"`
}

type WaybillWithReturn struct {
	ID              string     `json:"id"`
	TrackingNumber  string     `json:"trackingNumber"`
	ShipperName     string     `json:"shipperName"`
	RecipientName   string     `json:"recipientName"`
	Origin          string     `json:"origin"`
	Destination     string     `json:"destination"`
	Status          string     `json:"status"`
	CreatedAt       time.Time  `json:"createdAt"`
	ReturnInfo      Return     `json:"returnInfo"`
}
