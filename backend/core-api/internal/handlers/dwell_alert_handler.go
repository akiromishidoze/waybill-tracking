package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type DwellAlertHandler struct {
	repo *repository.DwellAlertRepository
}

func NewDwellAlertHandler(repo *repository.DwellAlertRepository) *DwellAlertHandler {
	return &DwellAlertHandler{repo: repo}
}

func (h *DwellAlertHandler) List(c *gin.Context) {
	resolvedStr := c.Query("resolved")
	var resolved *bool
	if resolvedStr != "" {
		val, _ := strconv.ParseBool(resolvedStr)
		resolved = &val
	}

	items, err := h.repo.List(c.Request.Context(), resolved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *DwellAlertHandler) Resolve(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Resolve(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
