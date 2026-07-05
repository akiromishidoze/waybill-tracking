package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

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

func (h *AuditLogHandler) Export(c *gin.Context) {
	var from, to *time.Time

	if v := c.Query("from"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid 'from' date, expected YYYY-MM-DD"})
			return
		}
		from = &t
	}
	if v := c.Query("to"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid 'to' date, expected YYYY-MM-DD"})
			return
		}
		end := t.Add(24*time.Hour - time.Second)
		to = &end
	}

	logs, err := h.repo.Export(c.Request.Context(), from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filename := fmt.Sprintf("audit-logs-%s.csv", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	w := csv.NewWriter(c.Writer)
	_ = w.Write([]string{"ID", "Timestamp", "User", "Role", "Action", "Resource Type", "Resource ID", "Details", "IP Address"})
	for _, l := range logs {
		_ = w.Write([]string{
			l.ID,
			l.CreatedAt.Format(time.RFC3339),
			l.UserName,
			l.UserRole,
			l.Action,
			l.ResourceType,
			l.ResourceID,
			l.Details,
			l.IPAddress,
		})
	}
	w.Flush()
}
