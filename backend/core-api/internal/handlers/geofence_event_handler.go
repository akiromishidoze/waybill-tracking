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
