package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/apierror"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type WebhookHandler struct {
	repo *repository.WebhookRepository
}

func NewWebhookHandler(repo *repository.WebhookRepository) *WebhookHandler {
	return &WebhookHandler{repo: repo}
}

func (h *WebhookHandler) List(c *gin.Context) {
	userIDRaw, _ := c.Get("userID")
	userID, _ := userIDRaw.(string)
	hooks, err := h.repo.ListByUser(c.Request.Context(), userID)

	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, hooks)
}

func (h *WebhookHandler) Create(c *gin.Context) {
	var req models.CreateWebhookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	userIDRaw, _ := c.Get("userID")
	userIDStr, _ := userIDRaw.(string)
	hook := &models.Webhook{
		ID:     uuid.New().String(),
		UserID: userIDStr,
		URL:    req.URL,
		Events: req.Events,
		Secret: req.Secret,
		Active: true,
	}

	if err := h.repo.Create(c.Request.Context(), hook); err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusCreated, hook)
}

func (h *WebhookHandler) Update(c *gin.Context) {
	id := c.Param("id")
	hook, err := h.repo.GetByID(c.Request.Context(), id)

	if err != nil {
		apierror.NotFoundJSON(c, "webhook not found")
		return
	}

	userIDRaw2, _ := c.Get("userID")
	userIDStr2, _ := userIDRaw2.(string)

	if hook.UserID != userIDStr2 {
		apierror.ForbiddenJSON(c, "not your webhook")
		return
	}

	var req models.UpdateWebhookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	if req.URL != "" {
		hook.URL = req.URL
	}

	if len(req.Events) > 0 {
		hook.Events = req.Events
	}

	if req.Secret != "" {
		hook.Secret = req.Secret
	}

	if req.Active != nil {
		hook.Active = *req.Active
	}

	if err := h.repo.Update(c.Request.Context(), hook); err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, hook)
}

func (h *WebhookHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	hook, err := h.repo.GetByID(c.Request.Context(), id)

	if err != nil {
		apierror.NotFoundJSON(c, "webhook not found")
		return
	}

	userIDRaw3, _ := c.Get("userID")
	userIDStr3, _ := userIDRaw3.(string)

	if hook.UserID != userIDStr3 {
		apierror.ForbiddenJSON(c, "not your webhook")
		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
