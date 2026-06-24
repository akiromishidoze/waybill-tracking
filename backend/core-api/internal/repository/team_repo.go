package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type TeamRepository struct {
	db *pgxpool.Pool
}

func NewTeamRepository(db *pgxpool.Pool) *TeamRepository {
	return &TeamRepository{db: db}
}

func (r *TeamRepository) List(ctx context.Context) ([]models.Team, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, description, color, created_at, updated_at
		FROM teams ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var t models.Team
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Color, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		teams = append(teams, t)
	}
	return teams, nil
}

func (r *TeamRepository) GetByID(ctx context.Context, id string) (*models.Team, error) {
	var t models.Team
	err := r.db.QueryRow(ctx, `
		SELECT id, name, description, color, created_at, updated_at
		FROM teams WHERE id = $1`, id).Scan(
		&t.ID, &t.Name, &t.Description, &t.Color, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TeamRepository) Create(ctx context.Context, team models.Team) (*models.Team, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		INSERT INTO teams (id, name, description, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		team.ID, team.Name, team.Description, team.Color, now, now,
	)
	if err != nil {
		return nil, err
	}
	team.CreatedAt = now
	team.UpdatedAt = now
	return &team, nil
}

func (r *TeamRepository) Update(ctx context.Context, id string, team models.Team) (*models.Team, error) {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE teams SET name = $1, description = $2, color = $3, updated_at = $4
		WHERE id = $5`,
		team.Name, team.Description, team.Color, now, id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *TeamRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM teams WHERE id = $1`, id)
	return err
}

func (r *WaybillRepository) AssignTeam(ctx context.Context, waybillID string, teamID *string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE waybills SET team_id = $1, updated_at = $2 WHERE id = $3`,
		teamID, time.Now(), waybillID,
	)
	return err
}
