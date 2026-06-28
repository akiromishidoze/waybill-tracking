package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type ECommerceWebhookHandler struct {
	waybillRepo   *repository.WaybillRepository
	ecommerceRepo *repository.ECommerceRepository
	db            *pgxpool.Pool
}

func NewECommerceWebhookHandler(waybillRepo *repository.WaybillRepository, ecommerceRepo *repository.ECommerceRepository, db *pgxpool.Pool) *ECommerceWebhookHandler {
	return &ECommerceWebhookHandler{waybillRepo: waybillRepo, ecommerceRepo: ecommerceRepo, db: db}
}

type ECommerceOrderWebhook struct {
	OrderID          string  `json:"orderId" binding:"required"`
	Platform         string  `json:"platform"`
	PlatformID       string  `json:"platformId"`
	RecipientName    string  `json:"recipientName" binding:"required"`
	RecipientAddress string  `json:"recipientAddress" binding:"required"`
	RecipientPhone   string  `json:"recipientPhone" binding:"required"`
	RecipientEmail   string  `json:"recipientEmail"`
	Origin           string  `json:"origin" binding:"required"`
	Destination      string  `json:"destination" binding:"required"`
	Weight           float64 `json:"weight"`
	Dimensions       string  `json:"dimensions"`
	ServiceType      string  `json:"serviceType"`
	Items            []struct {
		Name     string `json:"name"`
		Quantity int    `json:"quantity"`
		Price    float64 `json:"price"`
	} `json:"items"`
}

func (h *ECommerceWebhookHandler) ReceiveOrder(c *gin.Context) {
	platformID := c.Param("platformId")

	var req ECommerceOrderWebhook
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify platform exists
	platform, err := h.ecommerceRepo.GetPlatformByID(c.Request.Context(), platformID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "platform not found"})
		return
	}

	// Look up system admin user for shipper_id
	var shipperID string
	err2 := h.db.QueryRow(context.Background(), `SELECT id FROM users WHERE role='ADMIN' LIMIT 1`).Scan(&shipperID)
	if err2 != nil {
		shipperID = platformID
	}

	// Generate tracking number
	trackingNumber := fmt.Sprintf("WBT-%s", uuid.New().String()[:8])

	serviceType := req.ServiceType
	if serviceType == "" {
		serviceType = "STANDARD"
	}

	wb := &models.Waybill{
		ID:               uuid.New().String(),
		TrackingNumber:   trackingNumber,
		ShipperID:        shipperID,
		ShipperName:      platform.StoreName,
		RecipientName:    req.RecipientName,
		RecipientAddress: req.RecipientAddress,
		RecipientPhone:   req.RecipientPhone,
		Origin:           req.Origin,
		Destination:      req.Destination,
		Weight:           req.Weight,
		Dimensions:       req.Dimensions,
		ServiceType:      serviceType,
		Status:           models.StatusCreated,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := h.waybillRepo.Create(c.Request.Context(), wb); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log sync event
	syncLog := models.ECommerceSyncLog{
		PlatformID:  platformID,
		Platform:    platform.Platform,
		StoreName:   platform.StoreName,
		Status:      "success",
		OrdersSynced: 1,
		ErrorsCount: 0,
	}
	h.ecommerceRepo.CreateSyncLog(c.Request.Context(), syncLog)

	c.JSON(http.StatusCreated, gin.H{
		"success":        true,
		"trackingNumber": trackingNumber,
		"waybillId":      wb.ID,
		"orderId":        req.OrderID,
		"platform":       platform.Platform,
		"storeName":      platform.StoreName,
	})
}
