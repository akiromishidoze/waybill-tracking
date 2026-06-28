package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type DwellAlertRepository struct {
	db *pgxpool.Pool
}

func NewDwellAlertRepository(db *pgxpool.Pool) *DwellAlertRepository {
	return &DwellAlertRepository{db: db}
}

func (r *DwellAlertRepository) List(ctx context.Context, resolved *bool) ([]models.DwellAlert, error) {
	var rows pgx.Rows
	var err error

	if resolved != nil {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, status, location, dwell_hours, threshold_hours, alert_type, is_resolved, resolved_at, created_at
			FROM dwell_alerts WHERE is_resolved = $1 ORDER BY created_at DESC`, *resolved)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, status, location, dwell_hours, threshold_hours, alert_type, is_resolved, resolved_at, created_at
			FROM dwell_alerts ORDER BY created_at DESC`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.DwellAlert{}
	for rows.Next() {
		var a models.DwellAlert
		if err := rows.Scan(&a.ID, &a.WaybillID, &a.TrackingNumber, &a.Status, &a.Location, &a.DwellHours, &a.ThresholdHours, &a.AlertType, &a.IsResolved, &a.ResolvedAt, &a.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, nil
}

func (r *DwellAlertRepository) Create(ctx context.Context, a *models.DwellAlert) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO dwell_alerts (waybill_id, tracking_number, status, location, dwell_hours, threshold_hours, alert_type, is_resolved, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		RETURNING id, created_at`,
		a.WaybillID, a.TrackingNumber, a.Status, a.Location, a.DwellHours, a.ThresholdHours, a.AlertType, a.IsResolved,
	).Scan(&a.ID, &a.CreatedAt)
}

func (r *DwellAlertRepository) Resolve(ctx context.Context, id string) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `UPDATE dwell_alerts SET is_resolved = true, resolved_at = $1 WHERE id = $2`, now, id)
	return err
}
