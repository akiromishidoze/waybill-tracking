package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/internal/models"
	"time"
)

type WaybillRepository struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewWaybillRepository(db *pgxpool.Pool, redis *redis.Client) *WaybillRepository {
	return &WaybillRepository{db: db, redis: redis}
}

func (r *WaybillRepository) List(ctx context.Context, search string, page, limit int) ([]models.Waybill, int, error) {
	if page < 1 {
		page = 1
	}

	if limit < 1 || limit > 200 {
		limit = 50
	}

	whereClause := ""
	var args []interface{}

	if search != "" {
		whereClause = ` WHERE tracking_number ILIKE '%' || $1 || '%' ESCAPE '\\' OR shipper_name ILIKE '%' || $1 || '%' ESCAPE '\\' OR recipient_name ILIKE '%' || $1 || '%' ESCAPE '\\'`
		args = append(args, search)
	}

	countQuery := `SELECT COUNT(*) FROM waybills` + whereClause
	var total int

	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	dataQuery := fmt.Sprintf(`
		SELECT w.id, w.tracking_number, w.shipper_id, w.shipper_name, w.recipient_name,
		       w.recipient_address, w.recipient_phone, w.origin, w.destination, w.weight,
		       w.dimensions, w.service_type, w.status, w.estimated_delivery, w.actual_delivery,
		       w.carrier_name, w.carrier_tracking_number, w.team_id, COALESCE(t.name, '') as team_name,
		       w.created_at, w.updated_at
		FROM waybills w LEFT JOIN teams t ON w.team_id = t.id%s ORDER BY w.created_at DESC LIMIT %d OFFSET %d`,
		whereClause, limit, offset)

	rows, err := r.db.Query(ctx, dataQuery, args...)

	if err != nil {
		return nil, 0, err
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
			&wb.ActualDelivery, &wb.CarrierName, &wb.CarrierTrackingNumber,
			&wb.TeamID, &wb.TeamName, &wb.CreatedAt, &wb.UpdatedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		waybills = append(waybills, wb)
	}

	return waybills, total, nil
}

func (r *WaybillRepository) ListByCourier(ctx context.Context, courierID string) ([]models.Waybill, error) {
	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT w.id, w.tracking_number, w.shipper_id, w.shipper_name,
		       w.recipient_name, w.recipient_address, w.recipient_phone,
		       w.origin, w.destination, w.weight, w.dimensions, w.service_type,
		       w.status, w.estimated_delivery, w.actual_delivery,
		       w.carrier_name, w.carrier_tracking_number, w.team_id, COALESCE(t.name, '') as team_name,
		       w.created_at, w.updated_at
		FROM waybills w LEFT JOIN teams t ON w.team_id = t.id
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
			&wb.ActualDelivery, &wb.CarrierName, &wb.CarrierTrackingNumber,
			&wb.TeamID, &wb.TeamName, &wb.CreatedAt, &wb.UpdatedAt,
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
		SELECT w.id, w.tracking_number, w.shipper_id, w.shipper_name, w.recipient_name,
		       w.recipient_address, w.recipient_phone, w.origin, w.destination, w.weight,
		       w.dimensions, w.service_type, w.status, w.estimated_delivery, w.actual_delivery,
		       w.carrier_name, w.carrier_tracking_number, w.team_id, COALESCE(t.name, '') as team_name,
		       w.created_at, w.updated_at
		FROM waybills w LEFT JOIN teams t ON w.team_id = t.id WHERE w.id = $1`, id).Scan(
		&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
		&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
		&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
		&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
		&wb.ActualDelivery, &wb.CarrierName, &wb.CarrierTrackingNumber,
		&wb.TeamID, &wb.TeamName, &wb.CreatedAt, &wb.UpdatedAt,
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
		SELECT w.id, w.tracking_number, w.shipper_id, w.shipper_name, w.recipient_name,
		       w.recipient_address, w.recipient_phone, w.origin, w.destination, w.weight,
		       w.dimensions, w.service_type, w.status, w.estimated_delivery, w.actual_delivery,
		       w.carrier_name, w.carrier_tracking_number, w.team_id, COALESCE(t.name, '') as team_name,
		       w.created_at, w.updated_at
		FROM waybills w LEFT JOIN teams t ON w.team_id = t.id WHERE w.tracking_number = $1`, tn).Scan(
		&wb.ID, &wb.TrackingNumber, &wb.ShipperID, &wb.ShipperName,
		&wb.RecipientName, &wb.RecipientAddress, &wb.RecipientPhone,
		&wb.Origin, &wb.Destination, &wb.Weight, &wb.Dimensions,
		&wb.ServiceType, &wb.Status, &wb.EstimatedDelivery,
		&wb.ActualDelivery, &wb.CarrierName, &wb.CarrierTrackingNumber,
		&wb.TeamID, &wb.TeamName, &wb.CreatedAt, &wb.UpdatedAt,
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

func (r *WaybillRepository) Update(ctx context.Context, id string, req models.UpdateWaybillRequest) error {
	_, err := r.db.Exec(ctx, `
		UPDATE waybills SET
			recipient_name = $1,
			recipient_address = $2,
			recipient_phone = $3,
			origin = $4,
			destination = $5,
			weight = $6,
			dimensions = $7,
			service_type = $8,
			estimated_delivery = $9,
			carrier_name = $10,
			carrier_tracking_number = $11,
			team_id = $12,
			updated_at = $13
		WHERE id = $14`,
		req.RecipientName, req.RecipientAddress, req.RecipientPhone,
		req.Origin, req.Destination, req.Weight, req.Dimensions,
		req.ServiceType, req.EstimatedDelivery, req.CarrierName,
		req.CarrierTrackingNumber, req.TeamID, time.Now(), id,
	)

	if err != nil {
		return err
	}

	cacheKey := fmt.Sprintf("track:*")
	iter := r.redis.Scan(ctx, 0, cacheKey, 0).Iterator()
	for iter.Next(ctx) {
		r.redis.Del(ctx, iter.Val())
	}
	return nil
}

func (r *WaybillRepository) UpdateStatus(ctx context.Context, wb *models.Waybill, event models.ScanEvent) error {
	tx, err := r.db.Begin(ctx)

	if err != nil {
		return err
	}

	defer tx.Rollback(ctx)

	statusSQL := string(wb.Status)
	if statusSQL == "DELIVERED" {
		if _, err := tx.Exec(ctx, `UPDATE waybills SET status=$1, updated_at=$2, actual_delivery=NOW() WHERE id=$3`,
			wb.Status, time.Now(), wb.ID); err != nil {
			return err
		}
	} else {
		if _, err := tx.Exec(ctx, `UPDATE waybills SET status=$1, updated_at=$2 WHERE id=$3`,
			wb.Status, time.Now(), wb.ID); err != nil {
			return err
		}
	}

	event.Timestamp = time.Now()

	if _, err := tx.Exec(ctx, `
		INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, remark, exception_code, exception_detail, resolved_at, event_type)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		event.ID, event.WaybillID, event.Status, event.Location,
		event.CourierID, event.CourierName, event.Timestamp, event.Remark,
		event.ExceptionCode, event.ExceptionDetail, event.ResolvedAt,
		event.EventType); err != nil {
		return err
	}

	cacheKey := fmt.Sprintf("track:%s", wb.TrackingNumber)
	r.redis.Del(ctx, cacheKey)

	return tx.Commit(ctx)
}

func (r *WaybillRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM waybills WHERE id = $1`, id)
	return err
}

func (r *WaybillRepository) getEvents(ctx context.Context, waybillID string) ([]models.ScanEvent, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, waybill_id, status, location, courier_id, courier_name, timestamp, remark, exception_code, exception_detail, resolved_at, event_type
		FROM scan_events WHERE waybill_id = $1 ORDER BY timestamp ASC`, waybillID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var events []models.ScanEvent
	for rows.Next() {
		var e models.ScanEvent
		if err := rows.Scan(&e.ID, &e.WaybillID, &e.Status, &e.Location,
			&e.CourierID, &e.CourierName, &e.Timestamp, &e.Remark,
			&e.ExceptionCode, &e.ExceptionDetail, &e.ResolvedAt, &e.EventType); err != nil {
			return nil, err
		}
		events = append(events, e)
	}

	return events, nil
}
