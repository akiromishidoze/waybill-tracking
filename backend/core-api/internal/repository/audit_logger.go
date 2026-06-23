package repository

import (
	"context"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/models"
)

type AuditLogger struct {
	repo *AuditLogRepository
}

func NewAuditLogger(repo *AuditLogRepository) *AuditLogger {
	return &AuditLogger{repo: repo}
}

func (l *AuditLogger) Log(ctx context.Context, userID, userName, userRole, action, resourceType, resourceID, details, ipAddress string) {
	entry := &models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID,
		UserName:     userName,
		UserRole:     userRole,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		IPAddress:    ipAddress,
	}
	_ = l.repo.Create(ctx, entry)
}
