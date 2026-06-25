package handlers

import (
	"encoding/csv"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	es "github.com/waybill-tracking/core-api/internal/elastic"
	"github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/utils"
	wh "github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type WaybillHandler struct {
	repo          *repository.WaybillRepository
	kafkaProducer *kafka.Producer
	wsHub         *ws.Hub
	esClient      *es.Client
	webhooks      *wh.Dispatcher
	auditLogger   *repository.AuditLogger
}

func NewWaybillHandler(repo *repository.WaybillRepository, kp *kafka.Producer, hub *ws.Hub, ec *es.Client, wd *wh.Dispatcher, al *repository.AuditLogger) *WaybillHandler {
	return &WaybillHandler{repo: repo, kafkaProducer: kp, wsHub: hub, esClient: ec, webhooks: wd, auditLogger: al}
}

func (h *WaybillHandler) List(c *gin.Context) {
	search := utils.SanitizeSearchTerm(c.Query("search"))
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
		ID:               uuid.New().String(),
		TrackingNumber:   generateTrackingNumber(),
		ShipperID:        userID.(string),
		ShipperName:      shipperName,
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

	if err := h.kafkaProducer.PublishStatusChange(c.Request.Context(), *wb); err != nil {
		log.Printf("kafka publish error: %v", err)
	}

	if err := h.esClient.IndexWaybill(c.Request.Context(), wb); err != nil {
		log.Printf("elasticsearch index error: %v", err)
	}

	h.webhooks.Dispatch(c.Request.Context(), "waybill.created", wb.ID, wb)

	h.auditLogger.Log(c.Request.Context(), userID.(string), shipperName, c.GetString("userRole"),
		"WAYBILL_CREATE", "waybill", wb.ID, "Waybill "+wb.TrackingNumber+" created", c.ClientIP())

	c.JSON(http.StatusCreated, wb)
}

func (h *WaybillHandler) ImportCSV(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing file: " + err.Error()})
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read CSV header: " + err.Error()})
		return
	}

	colIndex := make(map[string]int)
	for i, col := range header {
		colIndex[strings.ToLower(strings.TrimSpace(col))] = i
	}

	required := []string{"recipientname", "recipientaddress", "recipientphone", "origin", "destination"}
	for _, col := range required {
		if _, ok := colIndex[col]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required column: " + col})
			return
		}
	}

	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")
	shipperName, _ := userName.(string)

	result := models.ImportWaybillResult{Errors: []string{}, WaybillIDs: []string{}}
	line := 2

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, "line "+strconv.Itoa(line)+": "+err.Error())
			line++
			continue
		}

		get := func(name string) string {
			if idx, ok := colIndex[name]; ok && idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		recipientName := get("recipientname")
		recipientAddress := get("recipientaddress")
		recipientPhone := get("recipientphone")
		origin := get("origin")
		destination := get("destination")

		if recipientName == "" || recipientAddress == "" || recipientPhone == "" || origin == "" || destination == "" {
			result.Failed++
			result.Errors = append(result.Errors, "line "+strconv.Itoa(line)+": missing required value")
			line++
			continue
		}

		weight := 0.0
		if w := get("weight"); w != "" {
			if parsed, err := strconv.ParseFloat(w, 64); err == nil {
				weight = parsed
			}
		}

		trackingNumber := get("trackingnumber")
		if trackingNumber == "" {
			trackingNumber = generateTrackingNumber()
		}

		wb := &models.Waybill{
			ID:               uuid.New().String(),
			TrackingNumber:   trackingNumber,
			ShipperID:        userID.(string),
			ShipperName:      shipperName,
			Status:           models.StatusCreated,
			RecipientName:    recipientName,
			RecipientAddress: recipientAddress,
			RecipientPhone:   recipientPhone,
			Origin:           origin,
			Destination:      destination,
			Weight:           weight,
			Dimensions:       get("dimensions"),
			ServiceType:      get("servicetype"),
		}

		if carrierName := get("carriername"); carrierName != "" {
			wb.CarrierName = &carrierName
		}
		if teamID := get("teamid"); teamID != "" {
			wb.TeamID = &teamID
		}

		if err := h.repo.Create(c.Request.Context(), wb); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, "line "+strconv.Itoa(line)+": "+err.Error())
			line++
			continue
		}

		if err := h.kafkaProducer.PublishStatusChange(c.Request.Context(), *wb); err != nil {
			log.Printf("kafka import publish error: %v", err)
		}
		if err := h.esClient.IndexWaybill(c.Request.Context(), wb); err != nil {
			log.Printf("elasticsearch import index error: %v", err)
		}
		h.webhooks.Dispatch(c.Request.Context(), "waybill.created", wb.ID, wb)

		result.Created++
		result.WaybillIDs = append(result.WaybillIDs, wb.ID)
		line++
	}

	if userName, ok := c.Get("userName"); ok {
		h.auditLogger.Log(c.Request.Context(), userID.(string), userName.(string), c.GetString("userRole"),
			"WAYBILL_IMPORT", "waybill", "", "Imported "+strconv.Itoa(result.Created)+" waybills", c.ClientIP())
	}

	c.JSON(http.StatusOK, result)
}

func (h *WaybillHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateWaybillRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wb, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "waybill not found"})
		return
	}

	if err := h.repo.Update(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	wb.RecipientName = req.RecipientName
	wb.RecipientAddress = req.RecipientAddress
	wb.RecipientPhone = req.RecipientPhone
	wb.Origin = req.Origin
	wb.Destination = req.Destination
	wb.Weight = req.Weight
	wb.Dimensions = req.Dimensions
	wb.ServiceType = req.ServiceType
	wb.EstimatedDelivery = req.EstimatedDelivery
	wb.CarrierName = req.CarrierName
	wb.CarrierTrackingNumber = req.CarrierTrackingNumber

	if err := h.esClient.IndexWaybill(c.Request.Context(), wb); err != nil {
		log.Printf("elasticsearch index error: %v", err)
	}

	h.webhooks.Dispatch(c.Request.Context(), "waybill.updated", wb.ID, wb)

	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")
	userIDStr, _ := userID.(string)
	userNameStr, _ := userName.(string)
	h.auditLogger.Log(c.Request.Context(), userIDStr, userNameStr, c.GetString("userRole"),
		"WAYBILL_UPDATE", "waybill", wb.ID, "Waybill "+wb.TrackingNumber+" updated", c.ClientIP())

	c.JSON(http.StatusOK, wb)
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

	eventType := models.EventScan
	if req.EventType != nil {
		eventType = *req.EventType
	} else if req.ExceptionCode != nil {
		eventType = models.EventException
	} else if isMilestoneStatus(req.Status) {
		eventType = models.EventMilestone
	}

	event := models.ScanEvent{
		ID:              uuid.New().String(),
		WaybillID:       id,
		Status:          req.Status,
		Location:        req.Location,
		Remark:          req.Remark,
		ExceptionCode:   req.ExceptionCode,
		ExceptionDetail: req.ExceptionDetail,
		ResolvedAt:      req.ResolvedAt,
		EventType:       eventType,
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

	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")
	h.auditLogger.Log(c.Request.Context(), userID.(string), userName.(string), c.GetString("userRole"),
		"STATUS_UPDATE", "waybill", wb.ID, "Status changed to "+string(wb.Status), c.ClientIP())

	c.JSON(http.StatusOK, wb)
}

func (h *WaybillHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	claims, _ := c.Get("claims")
	userRole := claims.(map[string]any)["role"].(string)
	if userRole != "ADMIN" && userRole != "OPS" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only OPS and ADMIN can delete waybills"})
		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")
	h.auditLogger.Log(c.Request.Context(), userID.(string), userName.(string), userRole,
		"WAYBILL_DELETE", "waybill", id, "Waybill deleted", c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *WaybillHandler) ListExceptionCodes(c *gin.Context) {
	codes := []models.ExceptionCodeInfo{
		{Code: models.ExceptionDelay, Label: "Delivery Delayed", Description: "Shipment delayed beyond estimated delivery date"},
		{Code: models.ExceptionDamage, Label: "Package Damaged", Description: "Package found damaged during transit or delivery"},
		{Code: models.ExceptionWrongAddress, Label: "Wrong Address", Description: "Recipient address is incorrect or incomplete"},
		{Code: models.ExceptionCustomerNotAvail, Label: "Customer Not Available", Description: "Recipient not present at delivery location"},
		{Code: models.ExceptionAddressNotFound, Label: "Address Not Found", Description: "Delivery address could not be located"},
		{Code: models.ExceptionRefused, Label: "Refused by Recipient", Description: "Recipient refused to accept the package"},
		{Code: models.ExceptionLost, Label: "Lost in Transit", Description: "Package missing and cannot be located"},
		{Code: models.ExceptionWeatherDelay, Label: "Weather Delay", Description: "Delay caused by adverse weather conditions"},
		{Code: models.ExceptionCustomsHold, Label: "Customs Hold", Description: "Package held by customs for inspection or documentation"},
		{Code: models.ExceptionInsufficientAddr, Label: "Insufficient Address", Description: "Address details insufficient for delivery"},
		{Code: models.ExceptionNoResponse, Label: "No Response", Description: "No response at delivery location after multiple attempts"},
		{Code: models.ExceptionWrongPackage, Label: "Wrong Package", Description: "Incorrect package delivered to recipient"},
		{Code: models.ExceptionOther, Label: "Other Exception", Description: "Other exception not covered by specific codes"},
	}
	c.JSON(http.StatusOK, codes)
}

func generateTrackingNumber() string {
	return "WBT-" + uuid.New().String()[:8]
}

func isMilestoneStatus(s models.WaybillStatus) bool {
	switch s {
	case models.StatusCreated, models.StatusPickedUp, models.StatusInTransit,
		models.StatusOutForDelivery, models.StatusDelivered,
		models.StatusReturned, models.StatusCancelled:
		return true
	}
	return false
}
