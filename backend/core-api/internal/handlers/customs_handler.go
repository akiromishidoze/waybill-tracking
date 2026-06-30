package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type CustomsHandler struct {
	repo *repository.CustomsRepository
}

func NewCustomsHandler(repo *repository.CustomsRepository) *CustomsHandler {
	return &CustomsHandler{repo: repo}
}

func (h *CustomsHandler) List(c *gin.Context) {
	shipments, err := h.repo.ListShipments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shipments)
}

func (h *CustomsHandler) UpdateStatus(c *gin.Context) {
	waybillID := c.Param("id")
	var req models.UpdateCustomsStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	shipment, err := h.repo.UpdateStatus(c.Request.Context(), waybillID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shipment)
}
