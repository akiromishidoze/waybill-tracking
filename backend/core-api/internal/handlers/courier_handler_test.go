package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestNewCourierHandler(t *testing.T) {
	h := NewCourierHandler(nil)
	if h == nil {
		t.Fatal("expected non-nil handler")
	}
	if h.repo != nil {
		t.Error("expected nil repo")
	}
}

func TestScan_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.POST("/courier/scan", h.Scan)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/courier/scan", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestScan_MissingTrackingNumber(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.POST("/courier/scan", h.Scan)

	body, _ := json.Marshal(map[string]string{})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/courier/scan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing trackingNumber, got %d", w.Code)
	}
}

func TestScan_EmptyTrackingNumber(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.POST("/courier/scan", h.Scan)

	body, _ := json.Marshal(map[string]string{
		"trackingNumber": "",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/courier/scan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty trackingNumber, got %d", w.Code)
	}
}

func TestScan_NoContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.POST("/courier/scan", h.Scan)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/courier/scan", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for no content type, got %d", w.Code)
	}
}

func TestGetAssignments_NoUserContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.GET("/courier/assignments", h.GetAssignments)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/courier/assignments", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when no user context, got %d", w.Code)
	}
}

func TestScan_TrackingNumberTooLong(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCourierHandler(nil)
	r := gin.New()
	r.POST("/courier/scan", h.Scan)

	longTN := string(make([]byte, 1000))
	body, _ := json.Marshal(map[string]string{
		"trackingNumber": longTN,
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/courier/scan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 for non-existent tracking number, got %d", w.Code)
	}
}
