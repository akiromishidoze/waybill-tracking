package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/storage"
)

type CustomsHandler struct {
	repo    *repository.CustomsRepository
	storage *storage.FileStorage
}

func NewCustomsHandler(repo *repository.CustomsRepository, fileStorage *storage.FileStorage) *CustomsHandler {
	return &CustomsHandler{repo: repo, storage: fileStorage}
}

func (h *CustomsHandler) List(c *gin.Context) {
	shipments, err := h.repo.ListShipments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shipments)
}

func (h *CustomsHandler) UpdateStatus(c *gin.Context) {
	waybillID := c.Param("id")
	var req models.UpdateCustomsStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	shipment, err := h.repo.UpdateStatus(c.Request.Context(), waybillID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shipment)
}

func (h *CustomsHandler) UploadDocument(c *gin.Context) {
	waybillID := c.Param("id")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	title := c.PostForm("title")
	if title == "" {
		title = file.Filename
	}

	docType := c.PostForm("docType")
	if docType == "" {
		docType = "OTHER"
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer src.Close()

	fileURL, err := h.storage.Save(src, file.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	doc, err := h.repo.CreateDocument(c.Request.Context(), waybillID, docType, title, file.Filename, int(file.Size), fileURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, doc)
}

func (h *CustomsHandler) DeleteDocument(c *gin.Context) {
	id := c.Param("docId")
	if err := h.repo.DeleteDocument(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "document deleted"})
}
