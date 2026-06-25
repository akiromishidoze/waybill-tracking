package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type CarrierRepository struct {
	db *pgxpool.Pool
}

func NewCarrierRepository(db *pgxpool.Pool) *CarrierRepository {
	return &CarrierRepository{db: db}
}

func (r *CarrierRepository) List(ctx context.Context) ([]models.Carrier, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, api_endpoint, api_key, is_active, tracking_url_template, created_at, updated_at
		FROM carriers ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	carriers := []models.Carrier{}
	for rows.Next() {
		var c models.Carrier
		if err := rows.Scan(&c.ID, &c.Name, &c.APIEndpoint, &c.APIKey, &c.IsActive,
			&c.TrackingURLTemplate, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		carriers = append(carriers, c)
	}
	return carriers, nil
}

func (r *CarrierRepository) GetByID(ctx context.Context, id string) (*models.Carrier, error) {
	var c models.Carrier
	err := r.db.QueryRow(ctx, `
		SELECT id, name, api_endpoint, api_key, is_active, tracking_url_template, created_at, updated_at
		FROM carriers WHERE id = $1`, id).Scan(
		&c.ID, &c.Name, &c.APIEndpoint, &c.APIKey, &c.IsActive,
		&c.TrackingURLTemplate, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CarrierRepository) Create(ctx context.Context, req models.CreateCarrierRequest) (*models.Carrier, error) {
	id := uuid.New().String()
	now := time.Now()
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO carriers (id, name, api_endpoint, api_key, is_active, tracking_url_template, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
		id, req.Name, req.APIEndpoint, req.APIKey, isActive, req.TrackingURLTemplate, now,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *CarrierRepository) Update(ctx context.Context, id string, req models.UpdateCarrierRequest) (*models.Carrier, error) {
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	name := existing.Name
	apiEndpoint := existing.APIEndpoint
	apiKey := existing.APIKey
	isActive := existing.IsActive
	trackingURL := existing.TrackingURLTemplate

	if req.Name != "" {
		name = req.Name
	}
	if req.APIEndpoint != "" {
		apiEndpoint = req.APIEndpoint
	}
	if req.APIKey != "" {
		apiKey = req.APIKey
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if req.TrackingURLTemplate != "" {
		trackingURL = req.TrackingURLTemplate
	}

	_, err = r.db.Exec(ctx, `
		UPDATE carriers SET name=$1, api_endpoint=$2, api_key=$3, is_active=$4,
		tracking_url_template=$5, updated_at=$6 WHERE id=$7`,
		name, apiEndpoint, apiKey, isActive, trackingURL, time.Now(), id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *CarrierRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM carriers WHERE id = $1`, id)
	return err
}
