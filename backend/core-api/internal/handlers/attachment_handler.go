package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Attachment struct {
	ID         string    `json:"id"`
	WaybillID  string    `json:"waybillId"`
	FileName   string    `json:"fileName"`
	FileType   string    `json:"fileType"`
	FileSize   int64     `json:"fileSize"`
	Data       string    `json:"data"`
	UploadedBy string    `json:"uploadedBy"`
	UploadedAt time.Time `json:"uploadedAt"`
}

type uploadRequest struct {
	FileName string `json:"fileName" binding:"required"`
	FileType string `json:"fileType" binding:"required"`
	FileSize int64  `json:"fileSize" binding:"required"`
	Data     string `json:"data" binding:"required"`
}

func NewAttachmentHandler(db *pgxpool.Pool) *AttachmentHandler {
	return &AttachmentHandler{db: db}
}

type AttachmentHandler struct {
	db *pgxpool.Pool
}

func (h *AttachmentHandler) List(c *gin.Context) {
	waybillID := c.Param("waybillId")

	rows, err := h.db.Query(c, `SELECT id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at FROM attachments WHERE waybill_id=$1 ORDER BY uploaded_at DESC`, waybillID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	attachments := []Attachment{}
	for rows.Next() {
		var a Attachment
		if err := rows.Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		attachments = append(attachments, a)
	}
	c.JSON(http.StatusOK, attachments)
}

func (h *AttachmentHandler) Upload(c *gin.Context) {
	waybillID := c.Param("waybillId")
	userID, _ := c.Get("userID")

	var req uploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.FileSize > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file size exceeds 10MB limit"})
		return
	}

	var a Attachment
	err := h.db.QueryRow(c,
		`INSERT INTO attachments (waybill_id, file_name, file_type, file_size, data, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at`,
		waybillID, req.FileName, req.FileType, req.FileSize, req.Data, userID,
	).Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, a)
}

func (h *AttachmentHandler) Get(c *gin.Context) {
	attachmentID := c.Param("attachmentId")

	var a Attachment
	err := h.db.QueryRow(c,
		`SELECT id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at FROM attachments WHERE id=$1`, attachmentID,
	).Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
		return
	}

	c.JSON(http.StatusOK, a)
}

func (h *AttachmentHandler) Delete(c *gin.Context) {
	attachmentID := c.Param("attachmentId")
	userID, _ := c.Get("userID")

	_, err := h.db.Exec(c, `DELETE FROM attachments WHERE id=$1 AND uploaded_by=$2`, attachmentID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "attachment deleted"})
}
