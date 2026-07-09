package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/apierror"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/utils"
)

type uploadRequest struct {
	FileName string `json:"fileName" binding:"required"`
	FileType string `json:"fileType" binding:"required"`
	FileSize int64  `json:"fileSize" binding:"required"`
	Data     string `json:"data" binding:"required"`
}

func NewAttachmentHandler(repo *repository.AttachmentRepository) *AttachmentHandler {
	return &AttachmentHandler{repo: repo}
}

type AttachmentHandler struct {
	repo *repository.AttachmentRepository
}

func (h *AttachmentHandler) List(c *gin.Context) {
	waybillID := c.Param("id")

	attachments, err := h.repo.List(c.Request.Context(), waybillID)
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, attachments)
}

func (h *AttachmentHandler) Upload(c *gin.Context) {
	waybillID := c.Param("id")
	userID, _ := c.Get("userID")

	var req uploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	if err := utils.ValidateFileSize(req.FileSize, 10*1024*1024); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	if err := utils.ValidateFileName(req.FileName); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	if err := utils.ValidateFileType(req.FileType); err != nil {
		apierror.BadRequestJSON(c, err.Error())
		return
	}

	a, err := h.repo.Create(c.Request.Context(), waybillID, req.FileName, req.FileType, req.FileSize, req.Data, userID.(string))
	if err != nil {
		apierror.InternalJSON(c, err)
		return
	}

	c.JSON(http.StatusCreated, a)
}

func (h *AttachmentHandler) Get(c *gin.Context) {
	attachmentID := c.Param("attachmentId")

	a, err := h.repo.GetByID(c.Request.Context(), attachmentID)
	if err != nil {
		apierror.NotFoundJSON(c, "attachment not found")
		return
	}

	c.JSON(http.StatusOK, a)
}

func (h *AttachmentHandler) Delete(c *gin.Context) {
	attachmentID := c.Param("attachmentId")
	userID, _ := c.Get("userID")

	if err := h.repo.Delete(c.Request.Context(), attachmentID, userID.(string)); err != nil {
		apierror.NotFoundJSON(c, "attachment not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "attachment deleted"})
}
