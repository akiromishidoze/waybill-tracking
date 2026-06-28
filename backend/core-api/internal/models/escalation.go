package models

import "time"

type Escalation struct {
	ID             string     `json:"id"`
	WaybillID      string     `json:"waybillId"`
	TrackingNumber string     `json:"trackingNumber"`
	EscalationType string     `json:"escalationType"`
	Severity       string     `json:"severity"`
	Reason         string     `json:"reason"`
	AssignedTo     *string    `json:"assignedTo,omitempty"`
	Status         string     `json:"status"`
	Notes          *string    `json:"notes,omitempty"`
	ResolvedAt     *time.Time `json:"resolvedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type CreateEscalationRequest struct {
	WaybillID      string  `json:"waybillId" binding:"required"`
	EscalationType string  `json:"escalationType" binding:"required"`
	Severity       string  `json:"severity" binding:"required"`
	Reason         string  `json:"reason" binding:"required"`
	AssignedTo     *string `json:"assignedTo"`
	Notes          *string `json:"notes"`
}

type UpdateEscalationRequest struct {
	Status     *string  `json:"status"`
	AssignedTo *string  `json:"assignedTo"`
	Notes      *string  `json:"notes"`
}
