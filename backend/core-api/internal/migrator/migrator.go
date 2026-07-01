package migrator

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"
)

type Migrator struct {
	db *pgxpool.Pool
	migrationsDir string
}

func New(db *pgxpool.Pool, migrationsDir string) *Migrator {
	return &Migrator{db: db, migrationsDir: migrationsDir}
}

func (m *Migrator) Run(ctx context.Context) error {
	if err := m.ensureTable(ctx); err != nil {
		return fmt.Errorf("ensure schema_migrations table: %w", err)
	}

	entries, err := os.ReadDir(m.migrationsDir)

	if err != nil {
		return fmt.Errorf("read migrations dir %s: %w", m.migrationsDir, err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	if len(files) == 0 {
		logger.L().Warn("migrator: no .sql files found", zap.String("dir", m.migrationsDir))

		return nil
	}

	applied := m.appliedSet(ctx)

	for _, f := range files {
		if applied[f] {
			continue
		}
		if err := m.apply(ctx, f); err != nil {
			return fmt.Errorf("apply %s: %w", f, err)
		}
	}

	return nil
}

func (m *Migrator) ensureTable(ctx context.Context) error {
	sql := `CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`
	_, err := m.db.Exec(ctx, sql)
	return err
}

func (m *Migrator) appliedSet(ctx context.Context) map[string]bool {
	set := map[string]bool{}
	rows, err := m.db.Query(ctx, `SELECT version FROM schema_migrations ORDER BY version`)

	if err != nil {
		return set
	}

	defer rows.Close()
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err == nil {
			set[v] = true
		}
	}

	return set
}

func (m *Migrator) Rollback(ctx context.Context, steps int) error {
	if err := m.ensureTable(ctx); err != nil {
		return fmt.Errorf("ensure schema_migrations table: %w", err)
	}

	applied := m.appliedList(ctx)
	if len(applied) == 0 {
		logger.L().Info("migrator: no applied migrations to roll back")
		return nil
	}

	sort.Sort(sort.Reverse(sort.StringSlice(applied)))

	if steps <= 0 || steps > len(applied) {
		steps = len(applied)
	}

	for i := 0; i < steps; i++ {
		filename := applied[i]
		if err := m.rollbackFile(ctx, filename); err != nil {
			return fmt.Errorf("rollback %s: %w", filename, err)
		}
	}

	return nil
}

func (m *Migrator) rollbackFile(ctx context.Context, filename string) error {
	downDir := filepath.Join(m.migrationsDir, "down")
	downPath := filepath.Join(downDir, filename)

	content, err := os.ReadFile(downPath)
	if err != nil {
		return fmt.Errorf("down migration file not found: %s", downPath)
	}

	tx, err := m.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		return fmt.Errorf("exec down %s: %w", filename, err)
	}

	if _, err := tx.Exec(ctx, `DELETE FROM schema_migrations WHERE version = $1`, filename); err != nil {
		return fmt.Errorf("remove record %s: %w", filename, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	logger.L().Info("migrator: rolled back migration", zap.String("file", filename))
	return nil
}

func (m *Migrator) appliedList(ctx context.Context) []string {
	rows, err := m.db.Query(ctx, `SELECT version FROM schema_migrations ORDER BY version`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var list []string
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err == nil {
			list = append(list, v)
		}
	}
	return list
}

func (m *Migrator) apply(ctx context.Context, filename string) error {
	path := filepath.Join(m.migrationsDir, filename)
	content, err := os.ReadFile(path)

	if err != nil {
		return err
	}

	tx, err := m.db.Begin(ctx)

	if err != nil {
		return err
	}

	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		return fmt.Errorf("exec %s: %w", filename, err)
	}

	if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, filename); err != nil {
		return fmt.Errorf("record %s: %w", filename, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	logger.L().Info("migrator: applied migration", zap.String("file", filename))
	return nil
}