package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/logger"
	"github.com/waybill-tracking/core-api/internal/models"
	"go.uber.org/zap"
)

type AuditLogger struct {
	repo *AuditLogRepository
}

func NewAuditLogger(repo *AuditLogRepository) *AuditLogger {
	return &AuditLogger{repo: repo}
}

func (l *AuditLogger) Log(ctx context.Context, userID, userName, userRole, action, resourceType, resourceID, details, ipAddress string) {
	if l.repo == nil {
		logger.L().Warn("audit logger: repository is nil, skipping log entry",
			zap.String("action", action), zap.String("userID", userID))
		return
	}
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
	if err := l.repo.Create(ctx, entry); err != nil {
		logger.L().Error("audit logger: failed to write audit log entry",
			zap.String("action", action), zap.String("userID", userID), zap.Error(err))
	}
}
