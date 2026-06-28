package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type AutoCommunicationRepository struct {
	db *pgxpool.Pool
}

func NewAutoCommunicationRepository(db *pgxpool.Pool) *AutoCommunicationRepository {
	return &AutoCommunicationRepository{db: db}
}

func (r *AutoCommunicationRepository) List(ctx context.Context, status *string) ([]models.AutoCommunication, error) {
	var rows pgx.Rows
	var err error

	if status != nil {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, trigger_type, trigger_event, recipient, channel, status, sent_at, error_message, created_at
			FROM auto_communications WHERE status = $1 ORDER BY created_at DESC`, *status)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, trigger_type, trigger_event, recipient, channel, status, sent_at, error_message, created_at
			FROM auto_communications ORDER BY created_at DESC`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.AutoCommunication{}
	for rows.Next() {
		var c models.AutoCommunication
		if err := rows.Scan(&c.ID, &c.WaybillID, &c.TrackingNumber, &c.TriggerType, &c.TriggerEvent, &c.Recipient, &c.Channel, &c.Status, &c.SentAt, &c.ErrorMessage, &c.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, nil
}

func (r *AutoCommunicationRepository) Create(ctx context.Context, c *models.AutoCommunication) error {
	if c.WaybillID != nil {
		var trackingNumber string
		_ = r.db.QueryRow(ctx, `SELECT tracking_number FROM waybills WHERE id = $1`, *c.WaybillID).Scan(&trackingNumber)
		c.TrackingNumber = &trackingNumber
	}

	return r.db.QueryRow(ctx, `
		INSERT INTO auto_communications (waybill_id, tracking_number, trigger_type, trigger_event, recipient, channel, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, created_at`,
		c.WaybillID, c.TrackingNumber, c.TriggerType, c.TriggerEvent, c.Recipient, c.Channel, c.Status,
	).Scan(&c.ID, &c.CreatedAt)
}

func (r *AutoCommunicationRepository) MarkSent(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE auto_communications SET status = 'SENT', sent_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *AutoCommunicationRepository) MarkFailed(ctx context.Context, id string, errorMsg string) error {
	_, err := r.db.Exec(ctx, `UPDATE auto_communications SET status = 'FAILED', error_message = $1 WHERE id = $2`, errorMsg, id)
	return err
}
