package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type WhiteLabelHandler struct {
	repo *repository.WhiteLabelRepository
}

func NewWhiteLabelHandler(repo *repository.WhiteLabelRepository) *WhiteLabelHandler {
	return &WhiteLabelHandler{repo: repo}
}

func (h *WhiteLabelHandler) GetPortal(c *gin.Context) {
	data, err := h.repo.Dashboard(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

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
