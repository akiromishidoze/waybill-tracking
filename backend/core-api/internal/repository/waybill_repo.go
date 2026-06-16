package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/internal/models"
)

type WaybillRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewWaybillRepository(db *pgxpool.Pool, redis *redis.Client) *WaybillRepository {
	return &WaybillRepository{db: db, redis: redis}
}

func (r *WaybillRepository) List(ctx context.Context) ([]models.Waybill, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tracking_number, shipper_id, shipper_name, recipient_name,
		       recipient_address, recipient_phone, origin, destination, weight,
		       dimensions, service_type, status, estimated_delivery, actual_delivery,
		       created_at, updated_at
		FROM waybills ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var waybills []models.Waybill
	for rows.Next() {
		var wb models.Waybill
		err := rows.Scan(
			&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
			&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
			&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
			&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
			&wb.ActualDelivery, &wb.CreatedAt, &wb.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		waybills = append(waybills, wb)
	}
	return waybills, nil
}

func (r *WaybillRepository) ListByCourier(ctx context.Context, courierID string) ([]models.Waybill, error) {
	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT w.id, w.tracking_number, w.shipper_id, w.shipper_name,
		       w.recipient_name, w.recipient_address, w.recipient_phone,
		       w.origin, w.destination, w.weight, w.dimensions, w.service_type,
		       w.status, w.estimated_delivery, w.actual_delivery,
		       w.created_at, w.updated_at
		FROM waybills w
		JOIN scan_events e ON e.waybill_id = w.id
		WHERE e.courier_id = $1
		ORDER BY w.updated_at DESC LIMIT 50`, courierID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var waybills []models.Waybill
	for rows.Next() {
		var wb models.Waybill
		if err := rows.Scan(
			&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
			&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
			&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
			&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
			&wb.ActualDelivery, &wb.CreatedAt, &wb.UpdatedAt,
		); err != nil {
			return nil, err
		}
		waybills = append(waybills, wb)
	}
	return waybills, nil
}

func (r *WaybillRepository) GetByID(ctx context.Context, id string) (*models.Waybill, error) {
	var wb models.Waybill
	err := r.db.QueryRow(ctx, `
		SELECT id, tracking_number, shipper_id, shipper_name, recipient_name,
		       recipient_address, recipient_phone, origin, destination, weight,
		       dimensions, service_type, status, estimated_delivery, actual_delivery,
		       created_at, updated_at
		FROM waybills WHERE id = $1`, id).Scan(
		&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
		&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
		&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
		&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
		&wb.ActualDelivery, &wb.CreatedAt, &wb.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	events, err := r.getEvents(ctx, id)
	if err == nil {
		wb.Events = events
	}
	return &wb, nil
}

func (r *WaybillRepository) GetByTrackingNumber(ctx context.Context, tn string) (*models.Waybill, error) {
	cacheKey := fmt.Sprintf("track:%s", tn)
	if cached, err := r.redis.Get(ctx, cacheKey).Result(); err == nil {
		var wb models.Waybill
		if json.Unmarshal([]byte(cached), &wb) == nil {
			return &wb, nil
		}
	}

	var wb models.Waybill
	err := r.db.QueryRow(ctx, `
		SELECT id, tracking_number, shipper_id, shipper_name, recipient_name,
		       recipient_address, recipient_phone, origin, destination, weight,
		       dimensions, service_type, status, estimated_delivery, actual_delivery,
		       created_at, updated_at
		FROM waybills WHERE tracking_number = $1`, tn).Scan(
		&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
		&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
		&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
		&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
		&wb.ActualDelivery, &wb.CreatedAt, &wb.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	wb.Events, _ = r.getEvents(ctx, wb.ID)

	if data, err := json.Marshal(wb); err == nil {
		r.redis.Set(ctx, cacheKey, string(data), 5*time.Minute)
	}
	return &wb, nil
}

func (r *WaybillRepository) Create(ctx context.Context, wb *models.Waybill) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO waybills (id, tracking_number, shipper_id, shipper_name,
			recipient_name, recipient_address, recipient_phone, origin, destination,
			weight, dimensions, service_type, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		wb.ID, wb.TrackingNumber, wb.ShipperID, wb.ShipperName,
		wb.RecipientName, wb.RecipientAddress, wb.RecipientPhone,
		wb.Origin, wb.Destination, wb.Weight, wb.Dimensions,
		wb.ServiceType, wb.Status, time.Now(), time.Now(),
	)
	return err
}

func (r *WaybillRepository) UpdateStatus(ctx context.Context, wb *models.Waybill, event models.ScanEvent) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `UPDATE waybills SET status=$1, updated_at=$2 WHERE id=$3`,
		wb.Status, time.Now(), wb.ID); err != nil {
		return err
	}

	event.Timestamp = time.Now()
	if _, err := tx.Exec(ctx, `
		INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, remark)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		event.ID, event.WaybillID, event.Status, event.Location,
		event.CourierID, event.CourierName, event.Timestamp, event.Remark); err != nil {
		return err
	}

	cacheKey := fmt.Sprintf("track:%s", wb.TrackingNumber)
	r.redis.Del(ctx, cacheKey)

	return tx.Commit(ctx)
}

func (r *WaybillRepository) getEvents(ctx context.Context, waybillID string) ([]models.ScanEvent, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, waybill_id, status, location, courier_id, courier_name, timestamp, remark
		FROM scan_events WHERE waybill_id = $1 ORDER BY timestamp ASC`, waybillID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.ScanEvent
	for rows.Next() {
		var e models.ScanEvent
		if err := rows.Scan(&e.ID, &e.WaybillID, &e.Status, &e.Location,
			&e.CourierID, &e.CourierName, &e.Timestamp, &e.Remark); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}
