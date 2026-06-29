package password

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/config"
)

// GenerateToken creates a cryptographically random token and stores it in the database.
func GenerateToken(ctx context.Context, db *pgxpool.Pool, userID string) (string, time.Time, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", time.Time{}, err
	}
	token := hex.EncodeToString(b)
	expiresAt := time.Now().Add(1 * time.Hour)

	_, err := db.Exec(ctx,
		`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}

// ValidateToken checks that a token exists, has not expired, and has not been used.
func ValidateToken(ctx context.Context, db *pgxpool.Pool, token string) (string, error) {
	var userID string
	err := db.QueryRow(ctx,
		`SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
		token,
	).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

// MarkUsed marks a token as used.
func MarkUsed(ctx context.Context, db *pgxpool.Pool, token string) error {
	_, err := db.Exec(ctx,
		`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
		token,
	)
	return err
}

// SendResetEmail queues a password reset email via the analytics-api internal email endpoint.
func SendResetEmail(cfg *config.Config, email, token string) {
	link := fmt.Sprintf("%s/reset-password?token=%s", strings.TrimRight(cfg.FrontendURL, "/"), token)
	body := fmt.Sprintf("Reset your password by clicking this link (expires in 1 hour): %s", link)

	payload := map[string]string{
		"to":      email,
		"subject": "Password reset request",
		"body":    body,
	}
	data, _ := json.Marshal(payload)

	url := strings.TrimRight(cfg.AnalyticsAPIURL, "/") + "/api/v1/notifications/email"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		logger.L().Error("password reset: failed to build email request", zap.Error(err))
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if cfg.InternalAPIKey != "" {
		req.Header.Set("X-Internal-API-Key", cfg.InternalAPIKey)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode >= 300 {
		logger.L().Error("password reset: failed to queue email", zap.String("email", email), zap.Error(err), zap.Int("status", resp.StatusCode))
		return
	}
	logger.L().Info("password reset: email queued", zap.String("email", email))
}
