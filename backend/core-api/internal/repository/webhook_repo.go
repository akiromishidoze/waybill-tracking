package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type WebhookRepository struct {
	db *pgxpool.Pool
}

func NewWebhookRepository(db *pgxpool.Pool) *WebhookRepository {
	return &WebhookRepository{db: db}
}

func (r *WebhookRepository) Create(ctx context.Context, w *models.Webhook) error {
	w.CreatedAt = time.Now()
	w.UpdatedAt = w.CreatedAt
	return r.db.QueryRow(ctx,
		`INSERT INTO webhooks (id, user_id, url, events, secret, active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING created_at`,
		w.ID, w.UserID, w.URL, w.Events, w.Secret, w.Active, w.CreatedAt, w.UpdatedAt,
	).Scan(&w.CreatedAt)
}

func (r *WebhookRepository) ListByUser(ctx context.Context, userID string) ([]models.Webhook, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, url, events, secret, active, created_at, updated_at
		 FROM webhooks WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hooks []models.Webhook
	for rows.Next() {
		var h models.Webhook
		if err := rows.Scan(&h.ID, &h.UserID, &h.URL, &h.Events, &h.Secret, &h.Active, &h.CreatedAt, &h.UpdatedAt); err != nil {
			return nil, err
		}
		hooks = append(hooks, h)
	}
	return hooks, nil
}

func (r *WebhookRepository) GetByID(ctx context.Context, id string) (*models.Webhook, error) {
	var h models.Webhook
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, url, events, secret, active, created_at, updated_at
		 FROM webhooks WHERE id=$1`, id,
	).Scan(&h.ID, &h.UserID, &h.URL, &h.Events, &h.Secret, &h.Active, &h.CreatedAt, &h.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *WebhookRepository) Update(ctx context.Context, h *models.Webhook) error {
	h.UpdatedAt = time.Now()
	_, err := r.db.Exec(ctx,
		`UPDATE webhooks SET url=$1, events=$2, secret=$3, active=$4, updated_at=$5 WHERE id=$6`,
		h.URL, h.Events, h.Secret, h.Active, h.UpdatedAt, h.ID,
	)
	return err
}

func (r *WebhookRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM webhooks WHERE id=$1`, id)
	return err
}

func (r *WebhookRepository) ListMatchingEvents(ctx context.Context, event string) ([]models.Webhook, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, url, events, secret, active, created_at, updated_at
		 FROM webhooks WHERE active=true AND $1 = ANY(events) ORDER BY created_at ASC`, event)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hooks []models.Webhook
	for rows.Next() {
		var h models.Webhook
		if err := rows.Scan(&h.ID, &h.UserID, &h.URL, &h.Events, &h.Secret, &h.Active, &h.CreatedAt, &h.UpdatedAt); err != nil {
			return nil, err
		}
		hooks = append(hooks, h)
	}
	return hooks, nil
}
