package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type EscalationRepository struct {
	db *pgxpool.Pool
}

func NewEscalationRepository(db *pgxpool.Pool) *EscalationRepository {
	return &EscalationRepository{db: db}
}

func (r *EscalationRepository) List(ctx context.Context, status *string) ([]models.Escalation, error) {
	var rows pgx.Rows
	var err error

	if status != nil {
		rows, err = r.db.Query(ctx, `
			SELECT e.id, e.waybill_id, e.tracking_number, e.escalation_type, e.severity, e.reason, e.assigned_to, e.status, e.notes, e.resolved_at, e.created_at, e.updated_at,
			       u.email as assigned_user_email
			FROM escalations e
			LEFT JOIN users u ON e.assigned_to = u.id
			WHERE e.status = $1 ORDER BY e.created_at DESC`, *status)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT e.id, e.waybill_id, e.tracking_number, e.escalation_type, e.severity, e.reason, e.assigned_to, e.status, e.notes, e.resolved_at, e.created_at, e.updated_at,
			       u.email as assigned_user_email
			FROM escalations e
			LEFT JOIN users u ON e.assigned_to = u.id
			ORDER BY e.created_at DESC`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.Escalation{}
	for rows.Next() {
		var e models.Escalation
		var assignedUserEmail *string
		if err := rows.Scan(&e.ID, &e.WaybillID, &e.TrackingNumber, &e.EscalationType, &e.Severity, &e.Reason, &e.AssignedTo, &e.Status, &e.Notes, &e.ResolvedAt, &e.CreatedAt, &e.UpdatedAt, &assignedUserEmail); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, nil
}

func (r *EscalationRepository) GetByID(ctx context.Context, id string) (*models.Escalation, error) {
	var e models.Escalation
	var assignedUserEmail *string
	err := r.db.QueryRow(ctx, `
		SELECT e.id, e.waybill_id, e.tracking_number, e.escalation_type, e.severity, e.reason, e.assigned_to, e.status, e.notes, e.resolved_at, e.created_at, e.updated_at,
		       u.email as assigned_user_email
		FROM escalations e
		LEFT JOIN users u ON e.assigned_to = u.id
		WHERE e.id = $1`, id).
		Scan(&e.ID, &e.WaybillID, &e.TrackingNumber, &e.EscalationType, &e.Severity, &e.Reason, &e.AssignedTo, &e.Status, &e.Notes, &e.ResolvedAt, &e.CreatedAt, &e.UpdatedAt, &assignedUserEmail)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EscalationRepository) Create(ctx context.Context, e *models.Escalation) error {
	now := time.Now()
	var trackingNumber string
	_ = r.db.QueryRow(ctx, `SELECT tracking_number FROM waybills WHERE id = $1`, e.WaybillID).Scan(&trackingNumber)
	e.TrackingNumber = trackingNumber

	return r.db.QueryRow(ctx, `
		INSERT INTO escalations (waybill_id, tracking_number, escalation_type, severity, reason, assigned_to, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at`,
		e.WaybillID, e.TrackingNumber, e.EscalationType, e.Severity, e.Reason, e.AssignedTo, e.Status, e.Notes, now, now,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *EscalationRepository) Update(ctx context.Context, id string, req models.UpdateEscalationRequest) (*models.Escalation, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE escalations SET
			status = COALESCE($1, status),
			assigned_to = COALESCE($2, assigned_to),
			notes = COALESCE($3, notes),
			updated_at = $4
		WHERE id = $5`,
		req.Status, req.AssignedTo, req.Notes, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *EscalationRepository) Resolve(ctx context.Context, id string) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE escalations SET status = 'RESOLVED', resolved_at = $1, updated_at = $1 WHERE id = $2`, now, id)
	return err
}
