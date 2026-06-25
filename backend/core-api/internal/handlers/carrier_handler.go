package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type CarrierHandler struct {
	repo *repository.CarrierRepository
}

func NewCarrierHandler(repo *repository.CarrierRepository) *CarrierHandler {
	return &CarrierHandler{repo: repo}
}

func (h *CarrierHandler) List(c *gin.Context) {
	carriers, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, carriers)
}

func (h *CarrierHandler) Create(c *gin.Context) {
	var req models.CreateCarrierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	carrier, err := h.repo.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, carrier)
}

func (h *CarrierHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateCarrierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	carrier, err := h.repo.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, carrier)
}

func (h *CarrierHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
