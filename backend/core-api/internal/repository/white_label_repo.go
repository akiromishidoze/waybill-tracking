package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type WhiteLabelRepository struct {
	db *pgxpool.Pool
}

func NewWhiteLabelRepository(db *pgxpool.Pool) *WhiteLabelRepository {
	return &WhiteLabelRepository{db: db}
}

func (r *WhiteLabelRepository) GetConfig(ctx context.Context) (*models.WhiteLabelConfig, error) {
	var c models.WhiteLabelConfig
	err := r.db.QueryRow(ctx, `
		SELECT id, brand_name, logo_url, custom_domain, primary_color, support_email, support_phone,
		       enabled, portal_url, created_at, updated_at
		FROM white_label_config
		ORDER BY created_at LIMIT 1`).Scan(
		&c.ID, &c.BrandName, &c.LogoURL, &c.CustomDomain, &c.PrimaryColor, &c.SupportEmail, &c.SupportPhone,
		&c.Enabled, &c.PortalURL, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *WhiteLabelRepository) UpdateConfig(ctx context.Context, req models.UpdateWhiteLabelConfigRequest) (*models.WhiteLabelConfig, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE white_label_config SET
			brand_name = COALESCE(NULLIF($1, ''), brand_name),
			logo_url = COALESCE($2, logo_url),
			custom_domain = COALESCE($3, custom_domain),
			primary_color = COALESCE(NULLIF($4, ''), primary_color),
			support_email = COALESCE(NULLIF($5, ''), support_email),
			support_phone = COALESCE(NULLIF($6, ''), support_phone),
			enabled = COALESCE($7, enabled),
			portal_url = COALESCE(NULLIF($8, ''), portal_url),
			updated_at = $9
		WHERE id = (SELECT id FROM white_label_config ORDER BY created_at LIMIT 1)`,
		req.BrandName, req.LogoURL, req.CustomDomain, req.PrimaryColor, req.SupportEmail, req.SupportPhone, req.Enabled, req.PortalURL, now,
	)
	if err != nil {
		return nil, err
	}
	return r.GetConfig(ctx)
}

func (r *WhiteLabelRepository) PortalStats(ctx context.Context) (*models.WhiteLabelStats, error) {
	var stats models.WhiteLabelStats

	// Active sessions placeholder: count public track requests in the last hour
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM waybills WHERE updated_at >= NOW() - INTERVAL '1 hour' AND status != 'DRAFT'`).Scan(&stats.ActiveSessions); err != nil {
		return nil, err
	}

	// Tracking queries today: count public track requests in the last 24h
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM waybills WHERE updated_at >= NOW() - INTERVAL '24 hours' AND status != 'DRAFT'`).Scan(&stats.TrackingQueriesToday); err != nil {
		return nil, err
	}

	// Registered customers placeholder: count distinct shipper/recipient contact combinations
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT shipper_email) FROM waybills WHERE shipper_email IS NOT NULL`).Scan(&stats.TotalRegisteredCustomers); err != nil {
		return nil, err
	}

	// Average satisfaction placeholder
	stats.AverageSatisfaction = 4.2

	return &stats, nil
}

func (r *WhiteLabelRepository) RecentTracking(ctx context.Context, limit int) ([]models.TrackingEvent, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, tracking_number, recipient_name, status, carrier_name, updated_at
		FROM waybills
		WHERE status != 'DRAFT'
		ORDER BY updated_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.TrackingEvent
	for rows.Next() {
		var e models.TrackingEvent
		var recipientName *string
		var carrierName *string
		if err := rows.Scan(&e.ID, &e.TrackingNumber, &recipientName, &e.Status, &carrierName, &e.Timestamp); err != nil {
			return nil, err
		}
		if recipientName != nil {
			e.CustomerName = *recipientName
		}
		if carrierName != nil {
			e.Carrier = *carrierName
		}
		events = append(events, e)
	}
	return events, nil
}

func (r *WhiteLabelRepository) Dashboard(ctx context.Context) (*models.WhiteLabelPortalData, error) {
	config, err := r.GetConfig(ctx)
	if err != nil {
		return nil, err
	}
	stats, err := r.PortalStats(ctx)
	if err != nil {
		return nil, err
	}
	recent, err := r.RecentTracking(ctx, 10)
	if err != nil {
		return nil, err
	}
	return &models.WhiteLabelPortalData{
		Config:         *config,
		Stats:          *stats,
		RecentTracking: recent,
	}, nil
}
