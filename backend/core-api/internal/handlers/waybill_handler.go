package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type WaybillHandler struct {
	repo *repository.WaybillRepository
}

func NewWaybillHandler(repo *repository.WaybillRepository) *WaybillHandler {
	return &WaybillHandler{repo: repo}
}

func (h *WaybillHandler) List(c *gin.Context) {
	waybills, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, waybills)
}

func (h *WaybillHandler) Get(c *gin.Context) {
	id := c.Param("id")
	wb, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "waybill not found"})
		return
	}
	c.JSON(http.StatusOK, wb)
}

func (h *WaybillHandler) Track(c *gin.Context) {
	trackingNumber := c.Param("trackingNumber")
	wb, err := h.repo.GetByTrackingNumber(c.Request.Context(), trackingNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tracking number not found"})
		return
	}
	c.JSON(http.StatusOK, wb)
}

func (h *WaybillHandler) Create(c *gin.Context) {
	var req models.CreateWaybillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	wb := &models.Waybill{
		ID:               uuid.New().String(),
		TrackingNumber:   generateTrackingNumber(),
		ShipperID:        userID.(string),
		Status:           models.StatusCreated,
		RecipientName:    req.RecipientName,
		RecipientAddress: req.RecipientAddress,
		RecipientPhone:   req.RecipientPhone,
		Origin:           req.Origin,
		Destination:      req.Destination,
		Weight:           req.Weight,
		Dimensions:       req.Dimensions,
		ServiceType:      req.ServiceType,
	}

	if err := h.repo.Create(c.Request.Context(), wb); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, wb)
}

func (h *WaybillHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var req models.StatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wb, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "waybill not found"})
		return
	}

	wb.Status = req.Status
	event := models.ScanEvent{
		ID:        uuid.New().String(),
		WaybillID: id,
		Status:    req.Status,
		Location:  req.Location,
		Remark:    req.Remark,
	}

	if err := h.repo.UpdateStatus(c.Request.Context(), wb, event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, wb)
}

func generateTrackingNumber() string {
	return "WBT-" + uuid.New().String()[:8]
}
