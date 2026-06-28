package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type ScheduledReportRepository struct {
	db *pgxpool.Pool
}

func NewScheduledReportRepository(db *pgxpool.Pool) *ScheduledReportRepository {
	return &ScheduledReportRepository{db: db}
}

func (r *ScheduledReportRepository) List(ctx context.Context, userID string) ([]models.ScheduledReport, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, name, report_type, schedule, recipients, last_run_at, next_run_at, is_active, created_at, updated_at
		FROM scheduled_reports WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []models.ScheduledReport{}
	for rows.Next() {
		var s models.ScheduledReport
		if err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.ReportType, &s.Schedule, &s.Recipients, &s.LastRunAt, &s.NextRunAt, &s.IsActive, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, nil
}

func (r *ScheduledReportRepository) GetByID(ctx context.Context, id string) (*models.ScheduledReport, error) {
	var s models.ScheduledReport
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, name, report_type, schedule, recipients, last_run_at, next_run_at, is_active, created_at, updated_at
		FROM scheduled_reports WHERE id = $1`, id).
		Scan(&s.ID, &s.UserID, &s.Name, &s.ReportType, &s.Schedule, &s.Recipients, &s.LastRunAt, &s.NextRunAt, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ScheduledReportRepository) Create(ctx context.Context, s *models.ScheduledReport) error {
	now := time.Now()
	return r.db.QueryRow(ctx, `
		INSERT INTO scheduled_reports (user_id, name, report_type, schedule, recipients, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at`,
		s.UserID, s.Name, s.ReportType, s.Schedule, s.Recipients, s.IsActive, now, now,
	).Scan(&s.ID, &s.CreatedAt)
}

func (r *ScheduledReportRepository) Update(ctx context.Context, id string, req models.UpdateScheduledReportRequest) (*models.ScheduledReport, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE scheduled_reports SET
			name = COALESCE($1, name),
			report_type = COALESCE($2, report_type),
			schedule = COALESCE($3, schedule),
			recipients = COALESCE($4, recipients),
			is_active = COALESCE($5, is_active),
			updated_at = $6
		WHERE id = $7`,
		req.Name, req.ReportType, req.Schedule, req.Recipients, req.IsActive, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *ScheduledReportRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM scheduled_reports WHERE id = $1`, id)
	return err
}

func (r *ScheduledReportRepository) UpdateLastRun(ctx context.Context, id string) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE scheduled_reports SET last_run_at = $1, updated_at = $1 WHERE id = $2`, now, id)
	return err
}
