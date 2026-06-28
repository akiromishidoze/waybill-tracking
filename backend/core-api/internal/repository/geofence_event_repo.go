package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type GeofenceEventRepository struct {
	db *pgxpool.Pool
}

func NewGeofenceEventRepository(db *pgxpool.Pool) *GeofenceEventRepository {
	return &GeofenceEventRepository{db: db}
}

func (r *GeofenceEventRepository) List(ctx context.Context, waybillID *string) ([]models.GeofenceEvent, error) {
	var rows pgx.Rows
	var err error

	if waybillID != nil {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, geofence_id, geofence_name, event_type, latitude, longitude, recorded_at
			FROM geofence_events WHERE waybill_id = $1 ORDER BY recorded_at DESC`, *waybillID)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, waybill_id, tracking_number, geofence_id, geofence_name, event_type, latitude, longitude, recorded_at
			FROM geofence_events ORDER BY recorded_at DESC`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.GeofenceEvent{}
	for rows.Next() {
		var e models.GeofenceEvent
		if err := rows.Scan(&e.ID, &e.WaybillID, &e.TrackingNumber, &e.GeofenceID, &e.GeofenceName, &e.EventType, &e.Latitude, &e.Longitude, &e.RecordedAt); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, nil
}

func (r *GeofenceEventRepository) Create(ctx context.Context, e *models.GeofenceEvent) error {
	var trackingNumber string
	_ = r.db.QueryRow(ctx, `SELECT tracking_number FROM waybills WHERE id = $1`, e.WaybillID).Scan(&trackingNumber)
	e.TrackingNumber = trackingNumber

	return r.db.QueryRow(ctx, `
		INSERT INTO geofence_events (waybill_id, tracking_number, geofence_id, geofence_name, event_type, latitude, longitude, recorded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, recorded_at`,
		e.WaybillID, e.TrackingNumber, e.GeofenceID, e.GeofenceName, e.EventType, e.Latitude, e.Longitude,
	).Scan(&e.ID, &e.RecordedAt)
}
