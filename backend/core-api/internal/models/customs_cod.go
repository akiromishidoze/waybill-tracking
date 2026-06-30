package models

import "time"

type CustomsDocument struct {
	ID             string     `json:"id"`
	WaybillID      string     `json:"waybillId"`
	TrackingNumber string     `json:"trackingNumber"`
	DocType        string     `json:"docType"`
	Title          string     `json:"title"`
	Status         string     `json:"status"`
	FileName       string     `json:"fileName"`
	FileSize       int        `json:"fileSize"`
	FileURL        *string    `json:"fileUrl"`
	Notes          *string    `json:"notes"`
	SubmittedAt    *time.Time `json:"submittedAt"`
	ApprovedAt     *time.Time `json:"approvedAt"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type CustomsShipment struct {
	ID                 string            `json:"id"`
	WaybillID          string            `json:"waybillId"`
	TrackingNumber     string            `json:"trackingNumber"`
	ShipperName        string            `json:"shipperName"`
	RecipientName      string            `json:"recipientName"`
	Origin             string            `json:"origin"`
	Destination        string            `json:"destination"`
	OriginCountry      string            `json:"originCountry"`
	DestinationCountry string            `json:"destinationCountry"`
	CustomsStatus      string            `json:"customsStatus"`
	EstimatedClearance *time.Time        `json:"estimatedClearance"`
	LastUpdated        time.Time         `json:"lastUpdated"`
	Documents          []CustomsDocument `json:"documents"`
}

type UpdateCustomsStatusRequest struct {
	CustomsStatus      string  `json:"customsStatus" binding:"required"`
	OriginCountry      string  `json:"originCountry"`
	DestinationCountry string  `json:"destinationCountry"`
	EstimatedClearance *string `json:"estimatedClearance"`
}

type CodPayment struct {
	ID            string     `json:"id"`
	WaybillID     string     `json:"waybillId"`
	TrackingNumber string    `json:"trackingNumber"`
	ShipperName   string     `json:"shipperName"`
	RecipientName string     `json:"recipientName"`
	Amount        float64    `json:"amount"`
	Fee           float64    `json:"fee"`
	NetAmount     float64    `json:"netAmount"`
	Currency      string     `json:"currency"`
	CarrierName   string     `json:"carrierName"`
	Status        string     `json:"status"`
	CollectedAt   time.Time  `json:"collectedAt"`
	SettledAt     *time.Time `json:"settledAt"`
	DisputeReason *string    `json:"disputeReason"`
	Notes         *string    `json:"notes"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type DisputeCodRequest struct {
	Reason string `json:"reason" binding:"required"`
}
