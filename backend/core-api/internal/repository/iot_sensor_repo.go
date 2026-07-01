package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type IoTSensorRepository struct {
	db *pgxpool.Pool
}

func NewIoTSensorRepository(db *pgxpool.Pool) *IoTSensorRepository {
	return &IoTSensorRepository{db: db}
}

func (r *IoTSensorRepository) ListSensors(ctx context.Context) ([]models.IoTSensor, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, sensor_id, sensor_type, location, status, last_reading_at, created_at
		FROM iot_sensors ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.IoTSensor{}
	for rows.Next() {
		var s models.IoTSensor
		if err := rows.Scan(&s.ID, &s.SensorID, &s.SensorType, &s.Location, &s.Status, &s.LastReadingAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, nil
}

func (r *IoTSensorRepository) CreateSensor(ctx context.Context, s *models.IoTSensor) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO iot_sensors (sensor_id, sensor_type, location, status, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, created_at`,
		s.SensorID, s.SensorType, s.Location, s.Status,
	).Scan(&s.ID, &s.CreatedAt)
}

func (r *IoTSensorRepository) ListReadings(ctx context.Context, sensorID *string, limit int) ([]models.IoTSensorReading, error) {
	var rows pgx.Rows
	var err error

	if sensorID != nil {
		rows, err = r.db.Query(ctx, `
			SELECT id, sensor_id, reading_type, value, unit, recorded_at
			FROM iot_sensor_readings WHERE sensor_id = $1 ORDER BY recorded_at DESC LIMIT $2`, *sensorID, limit)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, sensor_id, reading_type, value, unit, recorded_at
			FROM iot_sensor_readings ORDER BY recorded_at DESC LIMIT $1`, limit)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.IoTSensorReading{}
	for rows.Next() {
		var r models.IoTSensorReading
		if err := rows.Scan(&r.ID, &r.SensorID, &r.ReadingType, &r.Value, &r.Unit, &r.RecordedAt); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, nil
}

func (r *IoTSensorRepository) CreateReading(ctx context.Context, reading *models.IoTSensorReading) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO iot_sensor_readings (sensor_id, reading_type, value, unit, recorded_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, recorded_at`,
		reading.SensorID, reading.ReadingType, reading.Value, reading.Unit,
	).Scan(&reading.ID, &reading.RecordedAt)
}

func (r *IoTSensorRepository) UpdateLastReading(ctx context.Context, sensorID string) error {
	_, err := r.db.Exec(ctx, `UPDATE iot_sensors SET last_reading_at = NOW() WHERE sensor_id = $1`, sensorID)
	return err
}

func (r *IoTSensorRepository) ListThresholds(ctx context.Context, sensorID *string) ([]models.IoTSensorThreshold, error) {
	var rows pgx.Rows
	var err error

	if sensorID != nil {
		rows, err = r.db.Query(ctx, `
			SELECT id, sensor_id, reading_type, min_value, max_value, severity, action_type, is_active, created_at, updated_at
			FROM iot_sensor_thresholds WHERE sensor_id = $1 ORDER BY created_at DESC`, *sensorID)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT id, sensor_id, reading_type, min_value, max_value, severity, action_type, is_active, created_at, updated_at
			FROM iot_sensor_thresholds ORDER BY created_at DESC`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.IoTSensorThreshold{}
	for rows.Next() {
		var t models.IoTSensorThreshold
		if err := rows.Scan(&t.ID, &t.SensorID, &t.ReadingType, &t.MinValue, &t.MaxValue, &t.Severity, &t.ActionType, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, nil
}

func (r *IoTSensorRepository) CreateThreshold(ctx context.Context, t *models.IoTSensorThreshold) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO iot_sensor_thresholds (sensor_id, reading_type, min_value, max_value, severity, action_type, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, created_at, updated_at`,
		t.SensorID, t.ReadingType, t.MinValue, t.MaxValue, t.Severity, t.ActionType, t.IsActive,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (r *IoTSensorRepository) UpdateThreshold(ctx context.Context, id string, t *models.IoTSensorThreshold) error {
	_, err := r.db.Exec(ctx, `
		UPDATE iot_sensor_thresholds
		SET sensor_id = $1, reading_type = $2, min_value = $3, max_value = $4, severity = $5, action_type = $6, is_active = $7, updated_at = NOW()
		WHERE id = $8`,
		t.SensorID, t.ReadingType, t.MinValue, t.MaxValue, t.Severity, t.ActionType, t.IsActive, id)
	return err
}

func (r *IoTSensorRepository) DeleteThreshold(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM iot_sensor_thresholds WHERE id = $1`, id)
	return err
}

func (r *IoTSensorRepository) GetActiveThresholds(ctx context.Context) ([]models.IoTSensorThreshold, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, sensor_id, reading_type, min_value, max_value, severity, action_type, is_active, created_at, updated_at
		FROM iot_sensor_thresholds WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.IoTSensorThreshold{}
	for rows.Next() {
		var t models.IoTSensorThreshold
		if err := rows.Scan(&t.ID, &t.SensorID, &t.ReadingType, &t.MinValue, &t.MaxValue, &t.Severity, &t.ActionType, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, nil
}
