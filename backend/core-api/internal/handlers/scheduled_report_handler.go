package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type ScheduledReportHandler struct {
	repo *repository.ScheduledReportRepository
}

func NewScheduledReportHandler(repo *repository.ScheduledReportRepository) *ScheduledReportHandler {
	return &ScheduledReportHandler{repo: repo}
}

func (h *ScheduledReportHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	items, err := h.repo.List(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ScheduledReportHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req models.CreateScheduledReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := &models.ScheduledReport{
		UserID:     userID.(string),
		Name:       req.Name,
		ReportType: req.ReportType,
		Schedule:   req.Schedule,
		Recipients: req.Recipients,
		IsActive:   true,
	}

	if err := h.repo.Create(c.Request.Context(), s); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *ScheduledReportHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateScheduledReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.repo.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *ScheduledReportHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *ScheduledReportHandler) RunNow(c *gin.Context) {
	id := c.Param("id")
	s, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		return
	}

	_ = h.repo.UpdateLastRun(c.Request.Context(), id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Report run successfully",
		"reportId": id,
		"reportName": s.Name,
		"reportType": s.ReportType,
		"runAt": time.Now(),
	})
}
