package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type BiIntegrationRepository struct {
	db *pgxpool.Pool
}

func NewBiIntegrationRepository(db *pgxpool.Pool) *BiIntegrationRepository {
	return &BiIntegrationRepository{db: db}
}

func (r *BiIntegrationRepository) scan(row interface {
	Scan(...any) error
}) (*models.BiIntegration, error) {
	var b models.BiIntegration
	var datasets []string
	err := row.Scan(
		&b.ID, &b.Name, &b.Platform, &b.Status,
		&b.Endpoint, &b.APIKey, &datasets,
		&b.RefreshInterval, &b.LastSyncAt, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if datasets == nil {
		datasets = []string{}
	}
	b.Datasets = datasets
	return &b, nil
}

func (r *BiIntegrationRepository) List(ctx context.Context) ([]models.BiIntegration, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, platform, status, endpoint, api_key, datasets,
		       refresh_interval, last_sync_at, created_at
		FROM bi_integrations ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.BiIntegration
	for rows.Next() {
		b, err := r.scan(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *b)
	}
	if result == nil {
		result = []models.BiIntegration{}
	}
	return result, nil
}

func (r *BiIntegrationRepository) GetByID(ctx context.Context, id string) (*models.BiIntegration, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, name, platform, status, endpoint, api_key, datasets,
		       refresh_interval, last_sync_at, created_at
		FROM bi_integrations WHERE id = $1`, id)
	return r.scan(row)
}

func (r *BiIntegrationRepository) Create(ctx context.Context, req models.CreateBiIntegrationRequest) (*models.BiIntegration, error) {
	id := uuid.New().String()
	refreshInterval := 60
	if req.RefreshInterval != nil {
		refreshInterval = *req.RefreshInterval
	}
	datasets := req.Datasets
	if datasets == nil {
		datasets = []string{}
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO bi_integrations
		  (id, name, platform, status, endpoint, api_key, datasets, refresh_interval, created_at, updated_at)
		VALUES ($1,$2,$3,'DISCONNECTED',$4,$5,$6,$7,NOW(),NOW())`,
		id, req.Name, req.Platform, req.Endpoint, req.APIKey, datasets, refreshInterval,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *BiIntegrationRepository) Update(ctx context.Context, id string, req models.UpdateBiIntegrationRequest) (*models.BiIntegration, error) {
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	name := existing.Name
	platform := existing.Platform
	status := existing.Status
	endpoint := existing.Endpoint
	apiKey := existing.APIKey
	datasets := existing.Datasets
	refreshInterval := existing.RefreshInterval

	if req.Name != nil {
		name = *req.Name
	}
	if req.Platform != nil {
		platform = *req.Platform
	}
	if req.Status != nil {
		status = *req.Status
	}
	if req.Endpoint != nil {
		endpoint = req.Endpoint
	}
	if req.APIKey != nil {
		apiKey = req.APIKey
	}
	if req.Datasets != nil {
		datasets = req.Datasets
	}
	if req.RefreshInterval != nil {
		refreshInterval = *req.RefreshInterval
	}

	_, err = r.db.Exec(ctx, `
		UPDATE bi_integrations
		SET name=$1, platform=$2, status=$3, endpoint=$4, api_key=$5,
		    datasets=$6, refresh_interval=$7, updated_at=NOW()
		WHERE id=$8`,
		name, platform, status, endpoint, apiKey, datasets, refreshInterval, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *BiIntegrationRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM bi_integrations WHERE id = $1`, id)
	return err
}

func (r *BiIntegrationRepository) Sync(ctx context.Context, id string) (*models.BiIntegration, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE bi_integrations
		SET status='CONNECTED', last_sync_at=$1, updated_at=$1
		WHERE id=$2`, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}
