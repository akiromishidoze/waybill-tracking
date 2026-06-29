package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type WhiteLabelHandler struct {
	repo *repository.WhiteLabelRepository
}

func NewWhiteLabelHandler(repo *repository.WhiteLabelRepository) *WhiteLabelHandler {
	return &WhiteLabelHandler{repo: repo}
}

// GetPortal — authenticated: returns the full portal dashboard (config + stats).
func (h *WhiteLabelHandler) GetPortal(c *gin.Context) {
	data, err := h.repo.Dashboard(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// UpdateConfig — authenticated ADMIN: updates white-label branding including slug.
func (h *WhiteLabelHandler) UpdateConfig(c *gin.Context) {
	var req models.UpdateWhiteLabelConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.repo.UpdateConfig(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// GetPublicPortal — unauthenticated: returns public branding config for /portal/:slug.
func (h *WhiteLabelHandler) GetPublicPortal(c *gin.Context) {
	slug := c.Param("slug")
	cfg, err := h.repo.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "portal not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.PublicPortalResponse{
		Slug:         cfg.Slug,
		BrandName:    cfg.BrandName,
		LogoURL:      cfg.LogoURL,
		PrimaryColor: cfg.PrimaryColor,
		SupportEmail: cfg.SupportEmail,
		SupportPhone: cfg.SupportPhone,
		PortalURL:    cfg.PortalURL,
	})
}

// PublicTrack — unauthenticated: returns branded tracking result for /portal/:slug/track/:trackingNumber.
func (h *WhiteLabelHandler) PublicTrack(c *gin.Context) {
	slug := c.Param("slug")
	trackingNumber := c.Param("trackingNumber")

	result, err := h.repo.GetPublicTrackingPage(c.Request.Context(), slug, trackingNumber)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "portal or tracking number not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
