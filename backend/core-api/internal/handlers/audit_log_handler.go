package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type AuditLogHandler struct {
	repo *repository.AuditLogRepository
}

func NewAuditLogHandler(repo *repository.AuditLogRepository) *AuditLogHandler {
	return &AuditLogHandler{repo: repo}
}

func (h *AuditLogHandler) List(c *gin.Context) {
	logs, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if logs == nil {
		logs = []models.AuditLog{}
	}
	c.JSON(http.StatusOK, logs)
}
