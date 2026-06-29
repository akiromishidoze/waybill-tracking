package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/webhook"
)

type WebhookDeliveryHandler struct {
	repo       *repository.WebhookDeliveryRepository
	dispatcher *webhook.Dispatcher
}

func NewWebhookDeliveryHandler(repo *repository.WebhookDeliveryRepository, dispatcher *webhook.Dispatcher) *WebhookDeliveryHandler {
	return &WebhookDeliveryHandler{repo: repo, dispatcher: dispatcher}
}

// List godoc
// GET /admin/webhook-deliveries?status=dead&limit=50&offset=0
func (h *WebhookDeliveryHandler) List(c *gin.Context) {
	var req models.WebhookDeliveryListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Limit <= 0 {
		req.Limit = 50
	}

	logs, err := h.repo.List(c.Request.Context(), req.Status, req.Limit, req.Offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deliveries": logs,
		"limit":      req.Limit,
		"offset":     req.Offset,
	})
}

// Retry godoc
// POST /admin/webhook-deliveries/:id/retry
func (h *WebhookDeliveryHandler) Retry(c *gin.Context) {
	id := c.Param("id")
	if err := h.dispatcher.RetryDelivery(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "retry queued", "delivery_id": id})
}
