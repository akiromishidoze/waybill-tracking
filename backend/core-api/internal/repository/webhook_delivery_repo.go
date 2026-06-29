package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type WebhookDeliveryRepository struct {
	db *pgxpool.Pool
}

func NewWebhookDeliveryRepository(db *pgxpool.Pool) *WebhookDeliveryRepository {
	return &WebhookDeliveryRepository{db: db}
}

func (r *WebhookDeliveryRepository) Create(ctx context.Context, d *models.WebhookDeliveryLog) error {
	now := time.Now()
	d.CreatedAt = now
	d.UpdatedAt = now
	return r.db.QueryRow(ctx, `
		INSERT INTO webhook_delivery_log
			(webhook_id, event, waybill_id, payload, status, attempt, max_attempts, next_retry_at, last_error, response_status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING id`,
		d.WebhookID, d.Event, d.WaybillID, d.Payload, d.Status, d.Attempt,
		d.MaxAttempts, d.NextRetryAt, d.LastError, d.ResponseStatus, d.CreatedAt, d.UpdatedAt,
	).Scan(&d.ID)
}

func (r *WebhookDeliveryRepository) Update(ctx context.Context, d *models.WebhookDeliveryLog) error {
	d.UpdatedAt = time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE webhook_delivery_log
		SET status=$1, attempt=$2, next_retry_at=$3, last_error=$4, response_status=$5, updated_at=$6
		WHERE id=$7`,
		d.Status, d.Attempt, d.NextRetryAt, d.LastError, d.ResponseStatus, d.UpdatedAt, d.ID,
	)
	return err
}

func (r *WebhookDeliveryRepository) GetByID(ctx context.Context, id string) (*models.WebhookDeliveryLog, error) {
	d := &models.WebhookDeliveryLog{}
	err := r.db.QueryRow(ctx, `
		SELECT id, webhook_id, event, waybill_id, payload, status, attempt, max_attempts,
		       next_retry_at, last_error, response_status, created_at, updated_at
		FROM webhook_delivery_log WHERE id=$1`, id,
	).Scan(
		&d.ID, &d.WebhookID, &d.Event, &d.WaybillID, &d.Payload, &d.Status,
		&d.Attempt, &d.MaxAttempts, &d.NextRetryAt, &d.LastError, &d.ResponseStatus,
		&d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *WebhookDeliveryRepository) List(ctx context.Context, status string, limit, offset int) ([]models.WebhookDeliveryLog, error) {
	if limit <= 0 {
		limit = 50
	}

	var rows pgx_rows
	var err error

	if status != "" {
		rows, err = r.db.Query(ctx, `
			SELECT id, webhook_id, event, waybill_id, payload, status, attempt, max_attempts,
			       next_retry_at, last_error, response_status, created_at, updated_at
			FROM webhook_delivery_log
			WHERE status=$1
			ORDER BY created_at DESC LIMIT $2 OFFSET $3`, status, limit, offset)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, webhook_id, event, waybill_id, payload, status, attempt, max_attempts,
			       next_retry_at, last_error, response_status, created_at, updated_at
			FROM webhook_delivery_log
			ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WebhookDeliveryLog
	for rows.Next() {
		var d models.WebhookDeliveryLog
		if err := rows.Scan(
			&d.ID, &d.WebhookID, &d.Event, &d.WaybillID, &d.Payload, &d.Status,
			&d.Attempt, &d.MaxAttempts, &d.NextRetryAt, &d.LastError, &d.ResponseStatus,
			&d.CreatedAt, &d.UpdatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, d)
	}
	return logs, nil
}

func (r *WebhookDeliveryRepository) ListDue(ctx context.Context) ([]models.WebhookDeliveryLog, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, webhook_id, event, waybill_id, payload, status, attempt, max_attempts,
		       next_retry_at, last_error, response_status, created_at, updated_at
		FROM webhook_delivery_log
		WHERE status='pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW())
		ORDER BY next_retry_at ASC NULLS FIRST
		LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WebhookDeliveryLog
	for rows.Next() {
		var d models.WebhookDeliveryLog
		if err := rows.Scan(
			&d.ID, &d.WebhookID, &d.Event, &d.WaybillID, &d.Payload, &d.Status,
			&d.Attempt, &d.MaxAttempts, &d.NextRetryAt, &d.LastError, &d.ResponseStatus,
			&d.CreatedAt, &d.UpdatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, d)
	}
	return logs, nil
}

// ResetForRetry moves a dead delivery back to pending so it can be re-attempted.
func (r *WebhookDeliveryRepository) ResetForRetry(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE webhook_delivery_log
		SET status='pending', attempt=0, next_retry_at=NOW(), last_error='', updated_at=NOW()
		WHERE id=$1 AND status IN ('dead','failed')`, id)
	return err
}

// pgx_rows is a local alias so we avoid importing pgx directly in the type signature.
type pgx_rows interface {
	Next() bool
	Scan(dest ...any) error
	Close()
}
