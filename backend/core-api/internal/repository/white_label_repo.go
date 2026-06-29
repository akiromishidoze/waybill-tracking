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

const selectWhiteLabelConfig = `
	SELECT id, COALESCE(slug,''), COALESCE(brand_name,''), logo_url, custom_domain,
	       COALESCE(primary_color,''), COALESCE(support_email,''), COALESCE(support_phone,''),
	       enabled, COALESCE(portal_url,''), created_at, updated_at
	FROM white_label_config`

func scanWhiteLabelConfig(row interface{ Scan(...any) error }) (*models.WhiteLabelConfig, error) {
	var c models.WhiteLabelConfig
	var logoURL, customDomain *string
	if err := row.Scan(
		&c.ID, &c.Slug, &c.BrandName, &logoURL, &customDomain,
		&c.PrimaryColor, &c.SupportEmail, &c.SupportPhone,
		&c.Enabled, &c.PortalURL, &c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	c.LogoURL = logoURL
	c.CustomDomain = customDomain
	return &c, nil
}

func (r *WhiteLabelRepository) GetConfig(ctx context.Context) (*models.WhiteLabelConfig, error) {
	return scanWhiteLabelConfig(r.db.QueryRow(ctx, selectWhiteLabelConfig+` ORDER BY created_at LIMIT 1`))
}

func (r *WhiteLabelRepository) GetBySlug(ctx context.Context, slug string) (*models.WhiteLabelConfig, error) {
	return scanWhiteLabelConfig(r.db.QueryRow(ctx, selectWhiteLabelConfig+` WHERE slug=$1 AND enabled=true`, slug))
}

func (r *WhiteLabelRepository) UpdateConfig(ctx context.Context, req models.UpdateWhiteLabelConfigRequest) (*models.WhiteLabelConfig, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE white_label_config SET
			slug = COALESCE(NULLIF($1, ''), slug),
			brand_name = COALESCE(NULLIF($2, ''), brand_name),
			logo_url = COALESCE($3, logo_url),
			custom_domain = COALESCE($4, custom_domain),
			primary_color = COALESCE(NULLIF($5, ''), primary_color),
			support_email = COALESCE(NULLIF($6, ''), support_email),
			support_phone = COALESCE(NULLIF($7, ''), support_phone),
			enabled = COALESCE($8, enabled),
			portal_url = COALESCE(NULLIF($9, ''), portal_url),
			updated_at = $10
		WHERE id = (SELECT id FROM white_label_config ORDER BY created_at LIMIT 1)`,
		req.Slug, req.BrandName, req.LogoURL, req.CustomDomain, req.PrimaryColor,
		req.SupportEmail, req.SupportPhone, req.Enabled, req.PortalURL, now,
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

	// Registered customers placeholder: count distinct shippers
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT shipper_id) FROM waybills`).Scan(&stats.TotalRegisteredCustomers); err != nil {
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

func (r *WhiteLabelRepository) GetPublicTrackingPage(ctx context.Context, slug, trackingNumber string) (*models.PublicTrackingResult, error) {
	cfg, err := r.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	portal := models.PublicPortalResponse{
		Slug:         cfg.Slug,
		BrandName:    cfg.BrandName,
		LogoURL:      cfg.LogoURL,
		PrimaryColor: cfg.PrimaryColor,
		SupportEmail: cfg.SupportEmail,
		SupportPhone: cfg.SupportPhone,
		PortalURL:    cfg.PortalURL,
	}

	var result models.PublicTrackingResult
	var estimatedDelivery *time.Time
	err = r.db.QueryRow(ctx, `
		SELECT tracking_number, status, COALESCE(origin,''), COALESCE(destination,''),
		       COALESCE(service_type,''), COALESCE(carrier_name,''), estimated_delivery
		FROM waybills WHERE tracking_number=$1`, trackingNumber,
	).Scan(
		&result.TrackingNumber, &result.Status, &result.Origin, &result.Destination,
		&result.ServiceType, &result.CarrierName, &estimatedDelivery,
	)
	if err != nil {
		return nil, err
	}
	result.EstimatedDelivery = estimatedDelivery
	result.Portal = portal

	rows, err := r.db.Query(ctx, `
		SELECT COALESCE(status,''), COALESCE(location,''), COALESCE(notes,''), created_at
		FROM scans
		WHERE waybill_id = (SELECT id FROM waybills WHERE tracking_number=$1)
		ORDER BY created_at ASC`, trackingNumber)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var e models.PublicScanEvent
		if err := rows.Scan(&e.Status, &e.Location, &e.Note, &e.CreatedAt); err != nil {
			return nil, err
		}
		result.Events = append(result.Events, e)
	}
	if result.Events == nil {
		result.Events = []models.PublicScanEvent{}
	}
	return &result, nil
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
