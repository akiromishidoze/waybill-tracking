package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type CODHandler struct {
	repo *repository.CODRepository
}

func NewCODHandler(repo *repository.CODRepository) *CODHandler {
	return &CODHandler{repo: repo}
}

func (h *CODHandler) List(c *gin.Context) {
	payments, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payments)
}

func (h *CODHandler) Settle(c *gin.Context) {
	id := c.Param("id")
	payment, err := h.repo.Settle(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func (h *CODHandler) Dispute(c *gin.Context) {
	id := c.Param("id")
	var req models.DisputeCodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	payment, err := h.repo.Dispute(c.Request.Context(), id, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func (h *CODHandler) Refund(c *gin.Context) {
	id := c.Param("id")
	payment, err := h.repo.Refund(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}
