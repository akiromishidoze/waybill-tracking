package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type ReturnRepository struct {
	db *pgxpool.Pool
}

func NewReturnRepository(db *pgxpool.Pool) *ReturnRepository {
	return &ReturnRepository{db: db}
}

func (r *ReturnRepository) List(ctx context.Context) ([]models.WaybillWithReturn, error) {
	rows, err := r.db.Query(ctx, `
		SELECT w.id, w.tracking_number, w.shipper_name, w.recipient_name, w.origin, w.destination, w.status, w.created_at,
		       rt.id, rt.status, rt.reason, rt.carrier, rt.notes, rt.return_tracking_number,
		       rt.requested_at, rt.completed_at, rt.created_at, rt.updated_at
		FROM returns rt
		JOIN waybills w ON w.id = rt.waybill_id
		ORDER BY rt.requested_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.WaybillWithReturn
	for rows.Next() {
		var wb models.WaybillWithReturn
		var ret models.Return
		if err := rows.Scan(
			&wb.ID, &wb.TrackingNumber, &wb.ShipperName, &wb.RecipientName,
			&wb.Origin, &wb.Destination, &wb.Status, &wb.CreatedAt,
			&ret.ID, &ret.Status, &ret.Reason, &ret.Carrier, &ret.Notes,
			&ret.ReturnTrackingNumber, &ret.RequestedAt, &ret.CompletedAt,
			&ret.CreatedAt, &ret.UpdatedAt,
		); err != nil {
			return nil, err
		}
		ret.WaybillID = wb.ID
		wb.ReturnInfo = ret
		results = append(results, wb)
	}
	if results == nil {
		results = []models.WaybillWithReturn{}
	}
	return results, nil
}

func (r *ReturnRepository) GetByWaybillID(ctx context.Context, waybillID string) (*models.Return, error) {
	var ret models.Return
	err := r.db.QueryRow(ctx, `
		SELECT id, waybill_id, status, reason, carrier, notes, return_tracking_number,
		       requested_at, completed_at, created_at, updated_at
		FROM returns WHERE waybill_id = $1`, waybillID,
	).Scan(
		&ret.ID, &ret.WaybillID, &ret.Status, &ret.Reason, &ret.Carrier, &ret.Notes,
		&ret.ReturnTrackingNumber, &ret.RequestedAt, &ret.CompletedAt, &ret.CreatedAt, &ret.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &ret, nil
}

func (r *ReturnRepository) InitiateReturn(ctx context.Context, waybillID string, req models.InitiateReturnRequest) (*models.Return, error) {
	id := uuid.New().String()
	now := time.Now()

	var carrier, notes *string
	if req.Carrier != "" {
		carrier = &req.Carrier
	}
	if req.Notes != "" {
		notes = &req.Notes
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO returns (id, waybill_id, status, reason, carrier, notes, requested_at, created_at, updated_at)
		VALUES ($1, $2, 'RETURN_REQUESTED', $3, $4, $5, $6, $6, $6)`,
		id, waybillID, req.Reason, carrier, notes, now,
	)
	if err != nil {
		return nil, err
	}

	_, err = r.db.Exec(ctx, `UPDATE waybills SET status='RETURNED', updated_at=$1 WHERE id=$2`, now, waybillID)
	if err != nil {
		return nil, err
	}

	return r.GetByWaybillID(ctx, waybillID)
}

func (r *ReturnRepository) UpdateStatus(ctx context.Context, waybillID string, req models.UpdateReturnStatusRequest) (*models.Return, error) {
	now := time.Now()

	var completedAt *time.Time
	if req.Status == "RETURN_COMPLETED" {
		completedAt = &now
	}

	var trackingNum, notes *string
	if req.ReturnTrackingNumber != "" {
		trackingNum = &req.ReturnTrackingNumber
	}
	if req.Notes != "" {
		notes = &req.Notes
	}

	_, err := r.db.Exec(ctx, `
		UPDATE returns SET
			status = $1,
			return_tracking_number = COALESCE($2, return_tracking_number),
			notes = COALESCE($3, notes),
			completed_at = COALESCE($4, completed_at),
			updated_at = $5
		WHERE waybill_id = $6`,
		req.Status, trackingNum, notes, completedAt, now, waybillID,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByWaybillID(ctx, waybillID)
}
