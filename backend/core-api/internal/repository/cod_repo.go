package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type CODRepository struct {
	db *pgxpool.Pool
}

func NewCODRepository(db *pgxpool.Pool) *CODRepository {
	return &CODRepository{db: db}
}

func (r *CODRepository) List(ctx context.Context) ([]models.CodPayment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			c.id, c.waybill_id, w.tracking_number, w.shipper_name, w.recipient_name,
			c.amount, c.fee, c.net_amount, c.currency, c.carrier_name,
			c.status, c.collected_at, c.settled_at, c.dispute_reason, c.notes,
			c.created_at, c.updated_at
		FROM cod_payments c
		JOIN waybills w ON w.id = c.waybill_id
		ORDER BY c.collected_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.CodPayment
	for rows.Next() {
		var p models.CodPayment
		if err := rows.Scan(
			&p.ID, &p.WaybillID, &p.TrackingNumber, &p.ShipperName, &p.RecipientName,
			&p.Amount, &p.Fee, &p.NetAmount, &p.Currency, &p.CarrierName,
			&p.Status, &p.CollectedAt, &p.SettledAt, &p.DisputeReason, &p.Notes,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	if payments == nil {
		payments = []models.CodPayment{}
	}
	return payments, nil
}

func (r *CODRepository) getByID(ctx context.Context, id string) (*models.CodPayment, error) {
	var p models.CodPayment
	err := r.db.QueryRow(ctx, `
		SELECT
			c.id, c.waybill_id, w.tracking_number, w.shipper_name, w.recipient_name,
			c.amount, c.fee, c.net_amount, c.currency, c.carrier_name,
			c.status, c.collected_at, c.settled_at, c.dispute_reason, c.notes,
			c.created_at, c.updated_at
		FROM cod_payments c
		JOIN waybills w ON w.id = c.waybill_id
		WHERE c.id = $1`, id,
	).Scan(
		&p.ID, &p.WaybillID, &p.TrackingNumber, &p.ShipperName, &p.RecipientName,
		&p.Amount, &p.Fee, &p.NetAmount, &p.Currency, &p.CarrierName,
		&p.Status, &p.CollectedAt, &p.SettledAt, &p.DisputeReason, &p.Notes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *CODRepository) Settle(ctx context.Context, id string) (*models.CodPayment, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE cod_payments SET status='SETTLED', settled_at=$1, updated_at=$1 WHERE id=$2`,
		now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.getByID(ctx, id)
}

func (r *CODRepository) Dispute(ctx context.Context, id string, reason string) (*models.CodPayment, error) {
	_, err := r.db.Exec(ctx, `
		UPDATE cod_payments SET status='DISPUTED', dispute_reason=$1, updated_at=NOW() WHERE id=$2`,
		reason, id,
	)
	if err != nil {
		return nil, err
	}
	return r.getByID(ctx, id)
}

func (r *CODRepository) Refund(ctx context.Context, id string) (*models.CodPayment, error) {
	_, err := r.db.Exec(ctx, `
		UPDATE cod_payments SET status='REFUNDED', updated_at=NOW() WHERE id=$1`, id,
	)
	if err != nil {
		return nil, err
	}
	return r.getByID(ctx, id)
}
