package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type CourierHandler struct {
	repo *repository.WaybillRepository
}

func NewCourierHandler(repo *repository.WaybillRepository) *CourierHandler {
	return &CourierHandler{repo: repo}
}

func (h *CourierHandler) GetAssignments(c *gin.Context) {
	userID, _ := c.Get("userID")
	waybills, err := h.repo.ListByCourier(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, waybills)
}

func (h *CourierHandler) Scan(c *gin.Context) {
	var req struct {
		TrackingNumber string `json:"trackingNumber" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wb, err := h.repo.GetByTrackingNumber(c.Request.Context(), req.TrackingNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tracking number not found"})
		return
	}
	c.JSON(http.StatusOK, wb)
}