package repository

import (
	"context"
	"time"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type AuditLogRepository struct {
	db *pgxpool.Pool
}

func NewAuditLogRepository(db *pgxpool.Pool) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		log.ID, log.UserID, log.UserName, log.UserRole, log.Action,
		log.ResourceType, log.ResourceID, log.Details, log.IPAddress, time.Now(),
	)
	return err
}

func (r *AuditLogRepository) List(ctx context.Context) ([]models.AuditLog, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address, created_at
		FROM audit_logs ORDER BY created_at DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.UserName, &l.UserRole,
			&l.Action, &l.ResourceType, &l.ResourceID, &l.Details,
			&l.IPAddress, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}
