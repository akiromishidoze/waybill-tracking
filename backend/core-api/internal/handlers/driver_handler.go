package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type DriverHandler struct {
	repo *repository.DriverRepository
}

func NewDriverHandler(repo *repository.DriverRepository) *DriverHandler {
	return &DriverHandler{repo: repo}
}

func (h *DriverHandler) ListAssignments(c *gin.Context) {
	assignments, err := h.repo.ListAssignments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignments)
}

func (h *DriverHandler) GetAssignment(c *gin.Context) {
	id := c.Param("id")
	a, err := h.repo.GetAssignment(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
		return
	}
	c.JSON(http.StatusOK, a)
}

func (h *DriverHandler) CreateAssignment(c *gin.Context) {
	var req models.CreateDriverAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a, err := h.repo.CreateAssignment(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, a)
}

func (h *DriverHandler) UpdateAssignmentStatus(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateDriverAssignmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a, err := h.repo.UpdateAssignmentStatus(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, a)
}

func (h *DriverHandler) ListScans(c *gin.Context) {
	scans, err := h.repo.ListScans(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, scans)
}
