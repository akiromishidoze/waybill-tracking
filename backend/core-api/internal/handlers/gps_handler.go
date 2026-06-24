package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

type GPSHandler struct {
	repo  *repository.GPSRepository
	wsHub *ws.Hub
}

func NewGPSHandler(repo *repository.GPSRepository, wsHub *ws.Hub) *GPSHandler {
	return &GPSHandler{repo: repo, wsHub: wsHub}
}

func (h *GPSHandler) CreateLocation(c *gin.Context) {
	var req models.CreateGPSLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	recordedAt := time.Now()
	if req.RecordedAt != nil {
		recordedAt = *req.RecordedAt
	}

	loc := &models.GPSLocation{
		ID:           uuid.New().String(),
		WaybillID:    req.WaybillID,
		CourierID:    req.CourierID,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Accuracy:     req.Accuracy,
		Altitude:     req.Altitude,
		Speed:        req.Speed,
		Heading:      req.Heading,
		BatteryLevel: req.BatteryLevel,
		RecordedAt:   recordedAt,
	}

	if req.CourierID == nil && uid != "" {
		loc.CourierID = &uid
	}

	if err := h.repo.Create(c.Request.Context(), loc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if h.wsHub != nil {
		h.wsHub.BroadcastWaybillUpdate(req.WaybillID, map[string]interface{}{
			"type":       "gps_update",
			"latitude":   req.Latitude,
			"longitude":  req.Longitude,
			"recordedAt": recordedAt,
		})
	}

	c.JSON(http.StatusCreated, loc)
}

func (h *GPSHandler) ListCurrent(c *gin.Context) {
	views, err := h.repo.ListCurrentWaybillViews(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, views)
}

func (h *GPSHandler) GetHistory(c *gin.Context) {
	waybillID := c.Param("id")
	if waybillID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing waybill id"})
		return
	}
	locs, err := h.repo.ListHistory(c.Request.Context(), waybillID, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, locs)
}

func (h *GPSHandler) GetLatest(c *gin.Context) {
	waybillID := c.Param("id")
	if waybillID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing waybill id"})
		return
	}
	loc, err := h.repo.GetLatestByWaybill(c.Request.Context(), waybillID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no gps data found"})
		return
	}
	c.JSON(http.StatusOK, loc)
}
