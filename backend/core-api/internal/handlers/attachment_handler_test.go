package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUploadAttachment_InvalidFileName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAttachmentHandler(nil)
	r := gin.New()

	r.POST("/waybills/:waybillId/attachments", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	}, h.Upload)

	body, _ := json.Marshal(uploadRequest{
		FileName: "../../../etc/passwd",
		FileType: "application/pdf",
		FileSize: 1024,
		Data:     "dGVzdA==",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills/123/attachments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid file name, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "file name") {
		t.Errorf("expected error message about file name, got %s", w.Body.String())
	}
}

func TestUploadAttachment_InvalidFileType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAttachmentHandler(nil)
	r := gin.New()

	r.POST("/waybills/:waybillId/attachments", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	}, h.Upload)

	body, _ := json.Marshal(uploadRequest{
		FileName: "document.exe",
		FileType: "application/x-msdownload",
		FileSize: 1024,
		Data:     "dGVzdA==",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills/123/attachments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid file type, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "unsupported file type") {
		t.Errorf("expected unsupported file type error, got %s", w.Body.String())
	}
}

func TestUploadAttachment_FileSizeTooLarge(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAttachmentHandler(nil)
	r := gin.New()

	r.POST("/waybills/:waybillId/attachments", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	}, h.Upload)

	body, _ := json.Marshal(uploadRequest{
		FileName: "document.pdf",
		FileType: "application/pdf",
		FileSize: 15 * 1024 * 1024,
		Data:     "dGVzdA==",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills/123/attachments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for oversized file, got %d", w.Code)
	}
}
