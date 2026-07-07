package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/apierror"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type CarrierRateHandler struct {
	repo *repository.CarrierRateRepository
}

func NewCarrierRateHandler(repo *repository.CarrierRateRepository) *CarrierRateHandler {
	return &CarrierRateHandler{repo: repo}
}

func (h *CarrierRateHandler) ListByCarrier(c *gin.Context) {
	if h.repo == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}
	carrierID := c.Param("carrierId")
	rates, err := h.repo.ListByCarrier(c.Request.Context(), carrierID)
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, rates)
}

func (h *CarrierRateHandler) Create(c *gin.Context) {
	carrierID := c.Param("carrierId")
	var req models.CreateCarrierRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}
	if h.repo == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}
	rate, err := h.repo.Create(c.Request.Context(), carrierID, req)
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusCreated, rate)
}

func (h *CarrierRateHandler) Update(c *gin.Context) {
	id := c.Param("rateId")
	var req models.UpdateCarrierRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}
	if h.repo == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}
	rate, err := h.repo.Update(c.Request.Context(), id, req)
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, rate)
}

func (h *CarrierRateHandler) Delete(c *gin.Context) {
	if h.repo == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}
	id := c.Param("rateId")
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *CarrierRateHandler) Compare(c *gin.Context) {
	if h.repo == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}
	serviceType := c.Query("serviceType")
	origin := c.Query("origin")
	destination := c.Query("destination")
	weightStr := c.DefaultQuery("weight", "1")

	weight, err := strconv.ParseFloat(weightStr, 64)
	if err != nil || weight <= 0 {
		weight = 1
	}

	quotes, err := h.repo.Compare(c.Request.Context(), serviceType, origin, destination, weight)
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, quotes)
}
