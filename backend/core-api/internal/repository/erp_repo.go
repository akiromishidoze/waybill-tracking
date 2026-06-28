package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type ErpRepository struct {
	db *pgxpool.Pool
}

func NewErpRepository(db *pgxpool.Pool) *ErpRepository {
	return &ErpRepository{db: db}
}

func (r *ErpRepository) List(ctx context.Context) ([]models.ErpIntegration, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, system, endpoint, auth_type, api_key, api_secret,
		       sync_direction, last_sync_at, last_sync_status, is_active, created_at, updated_at
		FROM erp_integrations ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.ErpIntegration{}
	for rows.Next() {
		var e models.ErpIntegration
		if err := rows.Scan(&e.ID, &e.Name, &e.System, &e.Endpoint, &e.AuthType, &e.APIKey, &e.APISecret,
			&e.SyncDirection, &e.LastSyncAt, &e.LastSyncStatus, &e.IsActive, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, nil
}

func (r *ErpRepository) GetByID(ctx context.Context, id string) (*models.ErpIntegration, error) {
	var e models.ErpIntegration
	err := r.db.QueryRow(ctx, `
		SELECT id, name, system, endpoint, auth_type, api_key, api_secret,
		       sync_direction, last_sync_at, last_sync_status, is_active, created_at, updated_at
		FROM erp_integrations WHERE id = $1`, id).
		Scan(&e.ID, &e.Name, &e.System, &e.Endpoint, &e.AuthType, &e.APIKey, &e.APISecret,
			&e.SyncDirection, &e.LastSyncAt, &e.LastSyncStatus, &e.IsActive, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ErpRepository) Create(ctx context.Context, e *models.ErpIntegration) error {
	now := time.Now()
	return r.db.QueryRow(ctx, `
		INSERT INTO erp_integrations (name, system, endpoint, auth_type, api_key, api_secret, sync_direction, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at`,
		e.Name, e.System, e.Endpoint, e.AuthType, e.APIKey, e.APISecret, e.SyncDirection, e.IsActive, now, now,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *ErpRepository) Update(ctx context.Context, id string, req models.UpdateErpIntegrationRequest) (*models.ErpIntegration, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE erp_integrations SET
			name = COALESCE($1, name),
			system = COALESCE($2, system),
			endpoint = COALESCE($3, endpoint),
			auth_type = COALESCE($4, auth_type),
			api_key = COALESCE($5, api_key),
			api_secret = COALESCE($6, api_secret),
			sync_direction = COALESCE($7, sync_direction),
			is_active = COALESCE($8, is_active),
			updated_at = $9
		WHERE id = $10`,
		req.Name, req.System, req.Endpoint, req.AuthType, req.APIKey, req.APISecret, req.SyncDirection, req.IsActive, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *ErpRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM erp_integrations WHERE id = $1`, id)
	return err
}

func (r *ErpRepository) UpdateSyncStatus(ctx context.Context, id string, status string) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE erp_integrations SET last_sync_at = $1, last_sync_status = $2, updated_at = $1 WHERE id = $3`,
		now, status, id)
	return err
}
