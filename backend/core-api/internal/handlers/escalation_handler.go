package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type EscalationHandler struct {
	repo *repository.EscalationRepository
}

func NewEscalationHandler(repo *repository.EscalationRepository) *EscalationHandler {
	return &EscalationHandler{repo: repo}
}

func (h *EscalationHandler) List(c *gin.Context) {
	status := c.Query("status")
	var statusPtr *string
	if status != "" {
		statusPtr = &status
	}

	items, err := h.repo.List(c.Request.Context(), statusPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *EscalationHandler) Get(c *gin.Context) {
	id := c.Param("id")
	item, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "escalation not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *EscalationHandler) Create(c *gin.Context) {
	var req models.CreateEscalationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	e := &models.Escalation{
		WaybillID:      req.WaybillID,
		EscalationType: req.EscalationType,
		Severity:       req.Severity,
		Reason:         req.Reason,
		AssignedTo:     req.AssignedTo,
		Status:         "OPEN",
		Notes:          req.Notes,
	}

	if err := h.repo.Create(c.Request.Context(), e); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

func (h *EscalationHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateEscalationRequest
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

func (h *EscalationHandler) Resolve(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Resolve(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
