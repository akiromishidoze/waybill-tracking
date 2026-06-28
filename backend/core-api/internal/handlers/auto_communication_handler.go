package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type AutoCommunicationHandler struct {
	repo *repository.AutoCommunicationRepository
}

func NewAutoCommunicationHandler(repo *repository.AutoCommunicationRepository) *AutoCommunicationHandler {
	return &AutoCommunicationHandler{repo: repo}
}

func (h *AutoCommunicationHandler) List(c *gin.Context) {
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

func (h *AutoCommunicationHandler) Create(c *gin.Context) {
	var req models.AutoCommunication
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status == "" {
		req.Status = "PENDING"
	}

	if err := h.repo.Create(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *AutoCommunicationHandler) MarkSent(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.MarkSent(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *AutoCommunicationHandler) MarkFailed(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		ErrorMessage string `json:"errorMessage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.MarkFailed(c.Request.Context(), id, req.ErrorMessage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
