package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type DriverRepository struct {
	db *pgxpool.Pool
}

func NewDriverRepository(db *pgxpool.Pool) *DriverRepository {
	return &DriverRepository{db: db}
}

func (r *DriverRepository) ListAssignments(ctx context.Context) ([]models.DriverAssignment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, driver_id, driver_name, waybill_id, tracking_number, status,
		       recipient_name, recipient_address, recipient_phone, origin, destination,
		       notes, assigned_at, picked_up_at, delivered_at
		FROM driver_assignments ORDER BY assigned_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []models.DriverAssignment
	for rows.Next() {
		var a models.DriverAssignment
		if err := rows.Scan(
			&a.ID, &a.DriverID, &a.DriverName, &a.WaybillID, &a.TrackingNumber, &a.Status,
			&a.RecipientName, &a.RecipientAddress, &a.RecipientPhone, &a.Origin, &a.Destination,
			&a.Notes, &a.AssignedAt, &a.PickedUpAt, &a.DeliveredAt,
		); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	if assignments == nil {
		assignments = []models.DriverAssignment{}
	}
	return assignments, nil
}

func (r *DriverRepository) GetAssignment(ctx context.Context, id string) (*models.DriverAssignment, error) {
	var a models.DriverAssignment
	err := r.db.QueryRow(ctx, `
		SELECT id, driver_id, driver_name, waybill_id, tracking_number, status,
		       recipient_name, recipient_address, recipient_phone, origin, destination,
		       notes, assigned_at, picked_up_at, delivered_at
		FROM driver_assignments WHERE id = $1`, id).Scan(
		&a.ID, &a.DriverID, &a.DriverName, &a.WaybillID, &a.TrackingNumber, &a.Status,
		&a.RecipientName, &a.RecipientAddress, &a.RecipientPhone, &a.Origin, &a.Destination,
		&a.Notes, &a.AssignedAt, &a.PickedUpAt, &a.DeliveredAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *DriverRepository) CreateAssignment(ctx context.Context, req models.CreateDriverAssignmentRequest) (*models.DriverAssignment, error) {
	var driverName string
	err := r.db.QueryRow(ctx, `SELECT name FROM users WHERE id = $1`, req.DriverID).Scan(&driverName)
	if err != nil {
		return nil, err
	}

	var wb struct {
		TrackingNumber   string
		RecipientName    string
		RecipientAddress string
		RecipientPhone   string
		Origin           string
		Destination      string
	}
	err = r.db.QueryRow(ctx, `
		SELECT tracking_number, recipient_name, recipient_address, recipient_phone, origin, destination
		FROM waybills WHERE id = $1`, req.WaybillID).Scan(
		&wb.TrackingNumber, &wb.RecipientName, &wb.RecipientAddress,
		&wb.RecipientPhone, &wb.Origin, &wb.Destination,
	)
	if err != nil {
		return nil, err
	}

	id := uuid.New().String()
	now := time.Now()
	_, err = r.db.Exec(ctx, `
		INSERT INTO driver_assignments
		  (id, driver_id, driver_name, waybill_id, tracking_number, status,
		   recipient_name, recipient_address, recipient_phone, origin, destination,
		   notes, assigned_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,'ASSIGNED',$6,$7,$8,$9,$10,$11,$12,$12,$12)`,
		id, req.DriverID, driverName, req.WaybillID, wb.TrackingNumber,
		wb.RecipientName, wb.RecipientAddress, wb.RecipientPhone,
		wb.Origin, wb.Destination, req.Notes, now,
	)
	if err != nil {
		return nil, err
	}

	return r.GetAssignment(ctx, id)
}

func (r *DriverRepository) UpdateAssignmentStatus(ctx context.Context, id string, req models.UpdateDriverAssignmentStatusRequest) (*models.DriverAssignment, error) {
	now := time.Now()
	var pickedUpAt, deliveredAt interface{}
	if req.Status == "PICKED_UP" {
		pickedUpAt = now
	}
	if req.Status == "DELIVERED" {
		deliveredAt = now
	}

	_, err := r.db.Exec(ctx, `
		UPDATE driver_assignments SET status=$1, picked_up_at=COALESCE($2, picked_up_at),
		delivered_at=COALESCE($3, delivered_at), updated_at=$4 WHERE id=$5`,
		req.Status, pickedUpAt, deliveredAt, now, id)
	if err != nil {
		return nil, err
	}

	a, err := r.GetAssignment(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.ScanType != "" {
		_, _ = r.db.Exec(ctx, `
			INSERT INTO driver_scan_events
			  (id, driver_id, driver_name, waybill_id, tracking_number, scan_type,
			   location, latitude, longitude, photo_url, signature, remark, timestamp)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
			uuid.New().String(), a.DriverID, a.DriverName, a.WaybillID, a.TrackingNumber,
			req.ScanType, req.Location, req.Latitude, req.Longitude,
			req.PhotoURL, req.Signature, req.Remark, now,
		)
	}

	return a, nil
}

func (r *DriverRepository) ListScans(ctx context.Context) ([]models.DriverScanEvent, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, driver_id, driver_name, waybill_id, tracking_number, scan_type,
		       location, latitude, longitude, photo_url, signature, remark, timestamp
		FROM driver_scan_events ORDER BY timestamp DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scans []models.DriverScanEvent
	for rows.Next() {
		var s models.DriverScanEvent
		if err := rows.Scan(
			&s.ID, &s.DriverID, &s.DriverName, &s.WaybillID, &s.TrackingNumber, &s.ScanType,
			&s.Location, &s.Latitude, &s.Longitude, &s.PhotoURL, &s.Signature, &s.Remark, &s.Timestamp,
		); err != nil {
			return nil, err
		}
		scans = append(scans, s)
	}
	if scans == nil {
		scans = []models.DriverScanEvent{}
	}
	return scans, nil
}
