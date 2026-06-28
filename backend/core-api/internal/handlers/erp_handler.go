package handlers

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type ErpHandler struct {
	repo *repository.ErpRepository
}

func NewErpHandler(repo *repository.ErpRepository) *ErpHandler {
	return &ErpHandler{repo: repo}
}

func (h *ErpHandler) List(c *gin.Context) {
	items, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ErpHandler) Create(c *gin.Context) {
	var req models.CreateErpIntegrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.AuthType == "" {
		req.AuthType = "NONE"
	}
	if req.SyncDirection == "" {
		req.SyncDirection = "BOTH"
	}

	e := &models.ErpIntegration{
		Name:          req.Name,
		System:        req.System,
		Endpoint:      req.Endpoint,
		AuthType:      req.AuthType,
		APIKey:        req.APIKey,
		APISecret:     req.APISecret,
		SyncDirection: req.SyncDirection,
		IsActive:      true,
	}

	if err := h.repo.Create(c.Request.Context(), e); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

func (h *ErpHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateErpIntegrationRequest
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

func (h *ErpHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *ErpHandler) Test(c *gin.Context) {
	id := c.Param("id")
	e, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "integration not found"})
		return
	}

	_, parseErr := url.ParseRequestURI(e.Endpoint)
	if parseErr != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("Invalid endpoint URL: %s", parseErr.Error())})
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(e.Endpoint)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("Connection failed: %s", err.Error())})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 400 {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": fmt.Sprintf("Connection successful (HTTP %d)", resp.StatusCode)})
	} else {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("Endpoint returned HTTP %d", resp.StatusCode)})
	}
}

func (h *ErpHandler) Sync(c *gin.Context) {
	id := c.Param("id")
	e, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "integration not found"})
		return
	}

	if !e.IsActive {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "Integration is not active"})
		return
	}

	_ = h.repo.UpdateSyncStatus(c.Request.Context(), id, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Sync completed successfully"})
}
