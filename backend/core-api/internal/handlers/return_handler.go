package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type ReturnHandler struct {
	repo *repository.ReturnRepository
}

func NewReturnHandler(repo *repository.ReturnRepository) *ReturnHandler {
	return &ReturnHandler{repo: repo}
}

func (h *ReturnHandler) List(c *gin.Context) {
	results, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *ReturnHandler) InitiateReturn(c *gin.Context) {
	waybillID := c.Param("id")
	var req models.InitiateReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ret, err := h.repo.InitiateReturn(c.Request.Context(), waybillID, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "waybill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ret)
}

func (h *ReturnHandler) UpdateStatus(c *gin.Context) {
	waybillID := c.Param("id")
	var req models.UpdateReturnStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ret, err := h.repo.UpdateStatus(c.Request.Context(), waybillID, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "return not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ret)
}
