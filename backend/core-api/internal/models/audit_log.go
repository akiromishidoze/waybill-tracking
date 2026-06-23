package models

import "time"

type AuditLog struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	UserName     string    `json:"userName"`
	UserRole     string    `json:"userRole"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resourceType"`
	ResourceID   string    `json:"resourceId"`
	Details      string    `json:"details"`
	IPAddress    string    `json:"ipAddress"`
	CreatedAt    time.Time `json:"createdAt"`
}
