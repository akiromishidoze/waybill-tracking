package repository

import (
	"context"
	"fmt"
	"strings"
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

func (r *AuditLogRepository) List(ctx context.Context, page, limit int, search string) ([]models.AuditLog, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 50
	}

	var args []interface{}
	whereClause := ""
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		args = append(args, like, like, like)
		whereClause = " WHERE LOWER(user_name) LIKE $1 OR LOWER(action) LIKE $2 OR LOWER(details) LIKE $3"
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs"+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `
		SELECT id, user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address, created_at
		FROM audit_logs` + whereClause + ` ORDER BY created_at DESC`
	if search != "" {
		query += ` LIMIT $4 OFFSET $5`
		args = append(args, limit, offset)
	} else {
		query += ` LIMIT $1 OFFSET $2`
		args = []interface{}{limit, offset}
	}
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.UserName, &l.UserRole,
			&l.Action, &l.ResourceType, &l.ResourceID, &l.Details,
			&l.IPAddress, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.AuditLog{}
	}
	return logs, total, nil
}

func (r *AuditLogRepository) Export(ctx context.Context, from, to *time.Time) ([]models.AuditLog, error) {
	query := `SELECT id, user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address, created_at
		FROM audit_logs`
	var args []interface{}
	var conditions []string

	if from != nil {
		args = append(args, *from)
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", len(args)))
	}
	if to != nil {
		args = append(args, *to)
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", len(args)))
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY created_at ASC"

	rows, err := r.db.Query(ctx, query, args...)
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
