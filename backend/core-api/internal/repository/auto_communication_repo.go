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

func (r *AutoCommunicationRepository) ListRules(ctx context.Context) ([]models.AutoCommunicationRule, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, trigger, channel, subject, template, send_to_shipper, send_to_recipient, is_active, created_at, updated_at
		FROM auto_communication_rules ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.AutoCommunicationRule{}
	for rows.Next() {
		var rule models.AutoCommunicationRule
		if err := rows.Scan(&rule.ID, &rule.Trigger, &rule.Channel, &rule.Subject, &rule.Template, &rule.SendToShipper, &rule.SendToRecipient, &rule.IsActive, &rule.CreatedAt, &rule.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, rule)
	}
	return result, nil
}

func (r *AutoCommunicationRepository) CreateRule(ctx context.Context, rule *models.AutoCommunicationRule) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO auto_communication_rules (trigger, channel, subject, template, send_to_shipper, send_to_recipient, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, created_at, updated_at`,
		rule.Trigger, rule.Channel, rule.Subject, rule.Template, rule.SendToShipper, rule.SendToRecipient, rule.IsActive,
	).Scan(&rule.ID, &rule.CreatedAt, &rule.UpdatedAt)
}

func (r *AutoCommunicationRepository) UpdateRule(ctx context.Context, id string, rule *models.AutoCommunicationRule) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auto_communication_rules
		SET trigger = $1, channel = $2, subject = $3, template = $4, send_to_shipper = $5, send_to_recipient = $6, is_active = $7, updated_at = NOW()
		WHERE id = $8`,
		rule.Trigger, rule.Channel, rule.Subject, rule.Template, rule.SendToShipper, rule.SendToRecipient, rule.IsActive, id)
	return err
}

func (r *AutoCommunicationRepository) DeleteRule(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM auto_communication_rules WHERE id = $1`, id)
	return err
}
