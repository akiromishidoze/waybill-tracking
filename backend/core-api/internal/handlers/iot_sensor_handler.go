package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type IoTSensorHandler struct {
	repo *repository.IoTSensorRepository
}

func NewIoTSensorHandler(repo *repository.IoTSensorRepository) *IoTSensorHandler {
	return &IoTSensorHandler{repo: repo}
}

func (h *IoTSensorHandler) ListSensors(c *gin.Context) {
	items, err := h.repo.ListSensors(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *IoTSensorHandler) CreateSensor(c *gin.Context) {
	var req models.CreateSensorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := &models.IoTSensor{
		SensorID:   req.SensorID,
		SensorType: req.SensorType,
		Location:   req.Location,
		Status:     "ACTIVE",
	}

	if err := h.repo.CreateSensor(c.Request.Context(), s); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *IoTSensorHandler) ListReadings(c *gin.Context) {
	sensorID := c.Query("sensorId")
	var sensorIDPtr *string
	if sensorID != "" {
		sensorIDPtr = &sensorID
	}

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	items, err := h.repo.ListReadings(c.Request.Context(), sensorIDPtr, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *IoTSensorHandler) CreateReading(c *gin.Context) {
	var req models.CreateReadingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reading := &models.IoTSensorReading{
		SensorID:    req.SensorID,
		ReadingType: req.ReadingType,
		Value:       req.Value,
		Unit:        req.Unit,
	}

	if err := h.repo.CreateReading(c.Request.Context(), reading); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = h.repo.UpdateLastReading(c.Request.Context(), req.SensorID)

	c.JSON(http.StatusCreated, reading)
}

func (h *IoTSensorHandler) ListThresholds(c *gin.Context) {
	sensorID := c.Query("sensorId")
	var sensorIDPtr *string
	if sensorID != "" {
		sensorIDPtr = &sensorID
	}

	items, err := h.repo.ListThresholds(c.Request.Context(), sensorIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *IoTSensorHandler) CreateThreshold(c *gin.Context) {
	var req models.IoTSensorThreshold
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateThreshold(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *IoTSensorHandler) UpdateThreshold(c *gin.Context) {
	id := c.Param("id")
	var req models.IoTSensorThreshold
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateThreshold(c.Request.Context(), id, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *IoTSensorHandler) DeleteThreshold(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.DeleteThreshold(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
