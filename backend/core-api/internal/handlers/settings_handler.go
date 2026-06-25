package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SettingsHandler struct {
	db *pgxpool.Pool
}

func NewSettingsHandler(db *pgxpool.Pool) *SettingsHandler {
	return &SettingsHandler{db: db}
}

type appSettings struct {
	CompanyName          string    `json:"companyName"`
	Timezone             string    `json:"timezone"`
	SessionTimeout       int       `json:"sessionTimeout"`
	EmailNotifications   bool      `json:"emailNotifications"`
	DefaultServiceType   string    `json:"defaultServiceType"`
	LogoURL              string    `json:"logoUrl"`
	DwellThresholdMinutes int      `json:"dwellThresholdMinutes"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

func (h *SettingsHandler) Get(c *gin.Context) {
	var s appSettings
	err := h.db.QueryRow(context.Background(), `
		SELECT company_name, timezone, session_timeout, email_notifications,
		       default_service_type, COALESCE(logo_url,''), dwell_threshold_minutes, updated_at
		FROM app_settings ORDER BY created_at LIMIT 1`).Scan(
		&s.CompanyName, &s.Timezone, &s.SessionTimeout, &s.EmailNotifications,
		&s.DefaultServiceType, &s.LogoURL, &s.DwellThresholdMinutes, &s.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *SettingsHandler) Update(c *gin.Context) {
	var req struct {
		CompanyName          *string `json:"companyName"`
		Timezone             *string `json:"timezone"`
		SessionTimeout       *int    `json:"sessionTimeout"`
		EmailNotifications   *bool   `json:"emailNotifications"`
		DefaultServiceType   *string `json:"defaultServiceType"`
		LogoURL              *string `json:"logoUrl"`
		DwellThresholdMinutes *int   `json:"dwellThresholdMinutes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	_, err := h.db.Exec(context.Background(), `
		UPDATE app_settings SET
			company_name          = COALESCE($1, company_name),
			timezone              = COALESCE($2, timezone),
			session_timeout       = COALESCE($3, session_timeout),
			email_notifications   = COALESCE($4, email_notifications),
			default_service_type  = COALESCE($5, default_service_type),
			logo_url              = COALESCE($6, logo_url),
			dwell_threshold_minutes = COALESCE($7, dwell_threshold_minutes),
			updated_at            = $8
		WHERE id = (SELECT id FROM app_settings ORDER BY created_at LIMIT 1)`,
		req.CompanyName, req.Timezone, req.SessionTimeout, req.EmailNotifications,
		req.DefaultServiceType, req.LogoURL, req.DwellThresholdMinutes, now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.Get(c)
}

func (h *SettingsHandler) GetDwellThreshold(c *gin.Context) {
	var threshold int
	err := h.db.QueryRow(context.Background(), `
		SELECT dwell_threshold_minutes FROM app_settings ORDER BY created_at LIMIT 1`).Scan(&threshold)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"thresholdMinutes": threshold})
}

func (h *SettingsHandler) SetDwellThreshold(c *gin.Context) {
	var req struct {
		ThresholdMinutes int `json:"thresholdMinutes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := h.db.Exec(context.Background(), `
		UPDATE app_settings SET dwell_threshold_minutes = $1, updated_at = $2
		WHERE id = (SELECT id FROM app_settings ORDER BY created_at LIMIT 1)`,
		req.ThresholdMinutes, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"thresholdMinutes": req.ThresholdMinutes})
}
