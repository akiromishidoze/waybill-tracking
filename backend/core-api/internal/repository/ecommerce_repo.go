package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type ECommerceRepository struct {
	db *pgxpool.Pool
}

func NewECommerceRepository(db *pgxpool.Pool) *ECommerceRepository {
	return &ECommerceRepository{db: db}
}

func (r *ECommerceRepository) ListPlatforms(ctx context.Context) ([]models.ECommercePlatform, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, platform, store_name, store_url, webhook_url, api_key, api_secret,
		       connected, total_orders, synced_orders, last_sync, created_at, updated_at
		FROM ecommerce_platforms ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var platforms []models.ECommercePlatform
	for rows.Next() {
		var p models.ECommercePlatform
		if err := rows.Scan(
			&p.ID, &p.Platform, &p.StoreName, &p.StoreURL, &p.WebhookURL, &p.APIKey, &p.APISecret,
			&p.Connected, &p.TotalOrders, &p.SyncedOrders, &p.LastSync, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		platforms = append(platforms, p)
	}
	return platforms, nil
}

func (r *ECommerceRepository) GetPlatformByID(ctx context.Context, id string) (*models.ECommercePlatform, error) {
	var p models.ECommercePlatform
	err := r.db.QueryRow(ctx, `
		SELECT id, platform, store_name, store_url, webhook_url, api_key, api_secret,
		       connected, total_orders, synced_orders, last_sync, created_at, updated_at
		FROM ecommerce_platforms WHERE id = $1`, id).Scan(
		&p.ID, &p.Platform, &p.StoreName, &p.StoreURL, &p.WebhookURL, &p.APIKey, &p.APISecret,
		&p.Connected, &p.TotalOrders, &p.SyncedOrders, &p.LastSync, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ECommerceRepository) CreatePlatform(ctx context.Context, p models.ECommercePlatform) (*models.ECommercePlatform, error) {
	now := time.Now()
	err := r.db.QueryRow(ctx, `
		INSERT INTO ecommerce_platforms (platform, store_name, store_url, webhook_url, api_key, api_secret, connected, total_orders, synced_orders, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id`,
		p.Platform, p.StoreName, p.StoreURL, p.WebhookURL, p.APIKey, p.APISecret,
		p.Connected, p.TotalOrders, p.SyncedOrders, now, now,
	).Scan(&p.ID)
	if err != nil {
		return nil, err
	}
	p.CreatedAt = now
	p.UpdatedAt = now
	return &p, nil
}

func (r *ECommerceRepository) UpdatePlatform(ctx context.Context, id string, req models.UpdateECommercePlatformRequest) (*models.ECommercePlatform, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE ecommerce_platforms SET
			platform = COALESCE(NULLIF($1, ''), platform),
			store_name = COALESCE(NULLIF($2, ''), store_name),
			store_url = COALESCE($3, store_url),
			webhook_url = COALESCE($4, webhook_url),
			api_key = COALESCE($5, api_key),
			api_secret = COALESCE($6, api_secret),
			connected = COALESCE($7, connected),
			updated_at = $8
		WHERE id = $9`,
		req.Platform, req.StoreName, req.StoreURL, req.WebhookURL, req.APIKey, req.APISecret, req.Connected, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetPlatformByID(ctx, id)
}

func (r *ECommerceRepository) DeletePlatform(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM ecommerce_platforms WHERE id = $1`, id)
	return err
}

func (r *ECommerceRepository) ListSyncLogs(ctx context.Context, limit int) ([]models.ECommerceSyncLog, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.db.Query(ctx, `
		SELECT l.id, l.platform_id, l.platform, l.store_name, l.status, l.orders_synced, l.errors_count, l.synced_at
		FROM ecommerce_sync_logs l
		ORDER BY l.synced_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.ECommerceSyncLog
	for rows.Next() {
		var l models.ECommerceSyncLog
		if err := rows.Scan(&l.ID, &l.PlatformID, &l.Platform, &l.StoreName, &l.Status, &l.OrdersSynced, &l.ErrorsCount, &l.SyncedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (r *ECommerceRepository) CreateSyncLog(ctx context.Context, log models.ECommerceSyncLog) (*models.ECommerceSyncLog, error) {
	now := time.Now()
	err := r.db.QueryRow(ctx, `
		INSERT INTO ecommerce_sync_logs (platform_id, platform, store_name, status, orders_synced, errors_count, synced_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`,
		log.PlatformID, log.Platform, log.StoreName, log.Status, log.OrdersSynced, log.ErrorsCount, now,
	).Scan(&log.ID)
	if err != nil {
		return nil, err
	}
	log.SyncedAt = now
	return &log, nil
}

func (r *ECommerceRepository) Dashboard(ctx context.Context) (*models.ECommerceDashboard, error) {
	platforms, err := r.ListPlatforms(ctx)
	if err != nil {
		return nil, err
	}
	logs, err := r.ListSyncLogs(ctx, 20)
	if err != nil {
		return nil, err
	}

	var totalConnected, totalDisconnected, totalOrdersSynced int
	var lastSync *time.Time
	for _, p := range platforms {
		if p.Connected {
			totalConnected++
		} else {
			totalDisconnected++
		}
		totalOrdersSynced += p.SyncedOrders
		if p.LastSync != nil && (lastSync == nil || p.LastSync.After(*lastSync)) {
			lastSync = p.LastSync
		}
	}
	for _, l := range logs {
		if l.Status == "success" {
			totalOrdersSynced += l.OrdersSynced
		}
		if lastSync == nil || l.SyncedAt.After(*lastSync) {
			ts := l.SyncedAt
			lastSync = &ts
		}
	}

	return &models.ECommerceDashboard{
		Platforms:   platforms,
		RecentSyncs: logs,
		Summary: models.ECommerceSummary{
			TotalConnected:    totalConnected,
			TotalDisconnected: totalDisconnected,
			TotalOrdersSynced: totalOrdersSynced,
			LastSyncAt:        lastSync,
		},
	}, nil
}
