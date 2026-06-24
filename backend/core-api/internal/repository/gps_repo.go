package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type GPSRepository struct {
	db *pgxpool.Pool
}

func NewGPSRepository(db *pgxpool.Pool) *GPSRepository {
	return &GPSRepository{db: db}
}

func (r *GPSRepository) Create(ctx context.Context, loc *models.GPSLocation) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO gps_locations (id, waybill_id, courier_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, recorded_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		loc.ID, loc.WaybillID, loc.CourierID, loc.Latitude, loc.Longitude, loc.Accuracy, loc.Altitude, loc.Speed, loc.Heading, loc.BatteryLevel, loc.RecordedAt, time.Now())
	return err
}

func (r *GPSRepository) GetLatestByWaybill(ctx context.Context, waybillID string) (*models.GPSLocation, error) {
	var loc models.GPSLocation
	err := r.db.QueryRow(ctx, `
		SELECT id, waybill_id, courier_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, recorded_at, created_at
		FROM gps_locations WHERE waybill_id = $1 ORDER BY recorded_at DESC LIMIT 1`, waybillID).Scan(
		&loc.ID, &loc.WaybillID, &loc.CourierID, &loc.Latitude, &loc.Longitude, &loc.Accuracy, &loc.Altitude, &loc.Speed, &loc.Heading, &loc.BatteryLevel, &loc.RecordedAt, &loc.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &loc, nil
}

func (r *GPSRepository) ListHistory(ctx context.Context, waybillID string, limit int) ([]models.GPSLocation, error) {
	if limit <= 0 {
		limit = 100
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, waybill_id, courier_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, recorded_at, created_at
		FROM gps_locations WHERE waybill_id = $1 ORDER BY recorded_at DESC LIMIT $2`, waybillID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var locs []models.GPSLocation
	for rows.Next() {
		var loc models.GPSLocation
		if err := rows.Scan(&loc.ID, &loc.WaybillID, &loc.CourierID, &loc.Latitude, &loc.Longitude, &loc.Accuracy, &loc.Altitude, &loc.Speed, &loc.Heading, &loc.BatteryLevel, &loc.RecordedAt, &loc.CreatedAt); err != nil {
			return nil, err
		}
		locs = append(locs, loc)
	}
	return locs, nil
}

func (r *GPSRepository) ListCurrentWaybillViews(ctx context.Context) ([]models.WaybillGPSView, error) {
	rows, err := r.db.Query(ctx, `
		SELECT w.id, w.tracking_number, w.recipient_name, w.status, w.origin, w.destination,
		       COALESCE(g.latitude, 0), COALESCE(g.longitude, 0), g.speed, g.heading, g.recorded_at,
		       CASE WHEN w.estimated_delivery IS NOT NULL AND w.estimated_delivery < NOW() AND w.status NOT IN ('DELIVERED', 'RETURNED', 'CANCELLED') THEN true ELSE false END as sla_breached
		FROM waybills w
		LEFT JOIN LATERAL (
			SELECT waybill_id, latitude, longitude, speed, heading, recorded_at
			FROM gps_locations
			WHERE waybill_id = w.id
			ORDER BY recorded_at DESC LIMIT 1
		) g ON g.waybill_id = w.id
		WHERE w.status NOT IN ('DELIVERED', 'RETURNED', 'CANCELLED')
		ORDER BY w.updated_at DESC
		LIMIT 500`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var views []models.WaybillGPSView
	for rows.Next() {
		var v models.WaybillGPSView
		if err := rows.Scan(&v.ID, &v.TrackingNumber, &v.RecipientName, &v.Status, &v.Origin, &v.Destination,
			&v.Latitude, &v.Longitude, &v.Speed, &v.Heading, &v.RecordedAt, &v.SLABreached); err != nil {
			return nil, err
		}
		v.LastLocation = "GPS"
		views = append(views, v)
	}
	return views, nil
}
