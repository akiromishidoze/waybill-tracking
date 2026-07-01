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

func (r *GeofenceEventRepository) ListZones(ctx context.Context) ([]models.GeofenceZone, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, zone_id, name, zone_type, center_lat, center_lon, radius_meters, polygon_coords, is_active, created_at, updated_at
		FROM geofence_zones ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.GeofenceZone{}
	for rows.Next() {
		var z models.GeofenceZone
		if err := rows.Scan(&z.ID, &z.ZoneID, &z.Name, &z.ZoneType, &z.CenterLat, &z.CenterLon, &z.RadiusMeters, &z.PolygonCoords, &z.IsActive, &z.CreatedAt, &z.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, z)
	}
	return result, nil
}

func (r *GeofenceEventRepository) CreateZone(ctx context.Context, z *models.GeofenceZone) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO geofence_zones (zone_id, name, zone_type, center_lat, center_lon, radius_meters, polygon_coords, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, created_at, updated_at`,
		z.ZoneID, z.Name, z.ZoneType, z.CenterLat, z.CenterLon, z.RadiusMeters, z.PolygonCoords, z.IsActive,
	).Scan(&z.ID, &z.CreatedAt, &z.UpdatedAt)
}

func (r *GeofenceEventRepository) UpdateZone(ctx context.Context, id string, z *models.GeofenceZone) error {
	_, err := r.db.Exec(ctx, `
		UPDATE geofence_zones
		SET zone_id = $1, name = $2, zone_type = $3, center_lat = $4, center_lon = $5, radius_meters = $6, polygon_coords = $7, is_active = $8, updated_at = NOW()
		WHERE id = $9`,
		z.ZoneID, z.Name, z.ZoneType, z.CenterLat, z.CenterLon, z.RadiusMeters, z.PolygonCoords, z.IsActive, id)
	return err
}

func (r *GeofenceEventRepository) DeleteZone(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM geofence_zones WHERE id = $1`, id)
	return err
}

func (r *GeofenceEventRepository) GetActiveZones(ctx context.Context) ([]models.GeofenceZone, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, zone_id, name, zone_type, center_lat, center_lon, radius_meters, polygon_coords, is_active, created_at, updated_at
		FROM geofence_zones WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.GeofenceZone{}
	for rows.Next() {
		var z models.GeofenceZone
		if err := rows.Scan(&z.ID, &z.ZoneID, &z.Name, &z.ZoneType, &z.CenterLat, &z.CenterLon, &z.RadiusMeters, &z.PolygonCoords, &z.IsActive, &z.CreatedAt, &z.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, z)
	}
	return result, nil
}
