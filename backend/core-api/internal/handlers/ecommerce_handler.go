package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type ECommerceHandler struct {
	repo *repository.ECommerceRepository
}

func NewECommerceHandler(repo *repository.ECommerceRepository) *ECommerceHandler {
	return &ECommerceHandler{repo: repo}
}

func (h *ECommerceHandler) Dashboard(c *gin.Context) {
	dash, err := h.repo.Dashboard(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dash)
}

func (h *ECommerceHandler) ListPlatforms(c *gin.Context) {
	platforms, err := h.repo.ListPlatforms(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, platforms)
}

func (h *ECommerceHandler) CreatePlatform(c *gin.Context) {
	var req models.CreateECommercePlatformRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := models.ECommercePlatform{
		ID:        uuid.New().String(),
		Platform:  req.Platform,
		StoreName: req.StoreName,
		StoreURL:  req.StoreURL,
		Connected: false,
	}

	created, err := h.repo.CreatePlatform(c.Request.Context(), p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *ECommerceHandler) UpdatePlatform(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateECommercePlatformRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.repo.UpdatePlatform(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *ECommerceHandler) DeletePlatform(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.DeletePlatform(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *ECommerceHandler) ListSyncLogs(c *gin.Context) {
	logs, err := h.repo.ListSyncLogs(c.Request.Context(), 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
