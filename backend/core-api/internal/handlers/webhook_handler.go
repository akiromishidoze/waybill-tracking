package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	userID, _ := c.Get("userID")
	hooks, err := h.repo.ListByUser(c.Request.Context(), userID.(string))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	c.JSON(http.StatusOK, hooks)
}

func (h *WebhookHandler) Create(c *gin.Context) {
	var req models.CreateWebhookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return
	}

	userID, _ := c.Get("userID")
	hook := &models.Webhook{
		ID: uuid.New().String(),
		UserID: userID.(string),
		URL: req.URL,
		Events: req.Events,
		Secret: req.Secret,
		Active: true,
	}

	if err := h.repo.Create(c.Request.Context(), hook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	c.JSON(http.StatusCreated, hook)
}

func (h *WebhookHandler) Update(c *gin.Context) {
	id := c.Param("id")
	hook, err := h.repo.GetByID(c.Request.Context(), id)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "webhook not found"})

		return
	}

	userID, _ := c.Get("userID")

	if hook.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your webhook"})

		return
	}

	var req models.UpdateWebhookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return
	}

	if req.URL != nil {
		hook.URL = *req.URL
	}

	if req.Events != nil {
		hook.Events = req.Events
	}

	if req.Secret != nil {
		hook.Secret = *req.Secret
	}

	if req.Active != nil {
		hook.Active = *req.Active
	}

	if err := h.repo.Update(c.Request.Context(), hook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	c.JSON(http.StatusOK, hook)
}

func (h *WebhookHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	hook, err := h.repo.GetByID(c.Request.Context(), id)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "webhook not found"})

		return
	}

	userID, _ := c.Get("userID")

	if hook.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your webhook"})

		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

		return
	}

	c.JSON(http.StatusNoContent, nil)
}