package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type GeofenceEventHandler struct {
	repo *repository.GeofenceEventRepository
}

func NewGeofenceEventHandler(repo *repository.GeofenceEventRepository) *GeofenceEventHandler {
	return &GeofenceEventHandler{repo: repo}
}

func (h *GeofenceEventHandler) List(c *gin.Context) {
	waybillID := c.Query("waybillId")
	var waybillIDPtr *string
	if waybillID != "" {
		waybillIDPtr = &waybillID
	}

	items, err := h.repo.List(c.Request.Context(), waybillIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *GeofenceEventHandler) Create(c *gin.Context) {
	var req models.GeofenceEvent
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Create(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *GeofenceEventHandler) ListZones(c *gin.Context) {
	items, err := h.repo.ListZones(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *GeofenceEventHandler) CreateZone(c *gin.Context) {
	var req models.GeofenceZone
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateZone(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *GeofenceEventHandler) UpdateZone(c *gin.Context) {
	id := c.Param("id")
	var req models.GeofenceZone
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateZone(c.Request.Context(), id, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *GeofenceEventHandler) DeleteZone(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.DeleteZone(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
