package handlers

import (
	"log"
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	es "github.com/waybill-tracking/core-api/internal/elastic"
	"github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	wh "github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

type WaybillHandler struct {
	repo *repository.WaybillRepository
	kafkaProducer *kafka.Producer
	wsHub *ws.Hub
	esClient *es.Client
	webhooks *wh.Dispatcher
}

func NewWaybillHandler(repo *repository.WaybillRepository, kp *kafka.Producer, hub *ws.Hub, ec *es.Client, wd *wh.Dispatcher) *WaybillHandler {
	return &WaybillHandler{repo: repo, kafkaProducer: kp, wsHub: hub, esClient: ec, webhooks: wd}
}

func (h *WaybillHandler) List(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	waybills, total, err := h.repo.List(c.Request.Context(), search, page, limit)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": waybills,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
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
	userName, _ := c.Get("userName")
	shipperName, _ := userName.(string)

	wb := &models.Waybill{
		ID: uuid.New().String(),
		TrackingNumber: generateTrackingNumber(),
		ShipperID: userID.(string),
		ShipperName: shipperName,
		Status: models.StatusCreated,
		RecipientName: req.RecipientName,
		RecipientAddress: req.RecipientAddress,
		RecipientPhone: req.RecipientPhone,
		Origin: req.Origin,
		Destination: req.Destination,
		Weight: req.Weight,
		Dimensions: req.Dimensions,
		ServiceType: req.ServiceType,
	}

	if err := h.repo.Create(c.Request.Context(), wb); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	if err := h.kafkaProducer.PublishStatusChange(c.Request.Context(), *wb); err != nil {
		log.Printf("kafka publish error: %v", err)
	}

	if err := h.esClient.IndexWaybill(c.Request.Context(), wb); err != nil {
		log.Printf("elasticsearch index error: %v", err)
	}

	h.webhooks.Dispatch(c.Request.Context(), "waybill.created", wb.ID, wb)

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

	if !models.IsValidTransition(wb.Status, req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid status transition from " + string(wb.Status) + " to " + string(req.Status),
		})

		return
	}

	event := models.ScanEvent{
		ID: uuid.New().String(),
		WaybillID: id,
		Status: req.Status,
		Location: req.Location,
		Remark: req.Remark,
	}

	wb.Status = req.Status

	if err := h.repo.UpdateStatus(c.Request.Context(), wb, event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	if err := h.kafkaProducer.PublishScanEvent(c.Request.Context(), event); err != nil {
		log.Printf("kafka publish scan event error: %v", err)
	}

	if err := h.kafkaProducer.PublishStatusChange(c.Request.Context(), *wb); err != nil {
		log.Printf("kafka publish status change error: %v", err)
	}

	h.wsHub.BroadcastWaybillUpdate(wb.TrackingNumber, wb)

	if err := h.esClient.IndexWaybill(c.Request.Context(), wb); err != nil {
		log.Printf("elasticsearch index error: %v", err)
	}

	h.webhooks.Dispatch(c.Request.Context(), "status.changed", wb.ID, wb)

	c.JSON(http.StatusOK, wb)
}

func generateTrackingNumber() string {
	return "WBT-" + uuid.New().String()[:8]
}