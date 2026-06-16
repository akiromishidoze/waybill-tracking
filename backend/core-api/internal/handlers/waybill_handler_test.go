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

func TestGenerateTrackingNumber(t *testing.T) {
	tn := generateTrackingNumber()

	if !strings.HasPrefix(tn, "WBT-") {
		t.Errorf("expected tracking number to start with WBT-, got %s", tn)
	}

	if len(tn) != 13 {
		t.Errorf("expected tracking number length 13, got %d (%s)", len(tn), tn)
	}
}

func TestGenerateTrackingNumber_Unique(t *testing.T) {
	seen := make(map[string]bool)

	for i := 0; i < 100; i++ {
		tn := generateTrackingNumber()
		if seen[tn] {
			t.Errorf("duplicate tracking number: %s", tn)
		}

		seen[tn] = true
	}
}

func TestNewWaybillHandler(t *testing.T) {
	h := NewWaybillHandler(nil, nil, nil)

	if h == nil {
		t.Fatal("expected non-nil handler")
	}

	if h.repo != nil {
		t.Error("expected nil repo")
	}

	if h.kafkaProducer != nil {
		t.Error("expected nil kafkaProducer")
	}

	if h.wsHub != nil {
		t.Error("expected nil wsHub")
	}
}

func TestCreateWaybill_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()

	r.POST("/waybills", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Set("userName", "Test Shipper")
		c.Next()
	}, h.Create)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestCreateWaybill_MissingRequiredFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()

	r.POST("/waybills", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Set("userName", "Test Shipper")
		c.Next()
	}, h.Create)

	body, _ := json.Marshal(map[string]string{
		"recipientName": "John Doe",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing required fields, got %d", w.Code)
	}
}

func TestCreateWaybill_MissingUserContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.POST("/waybills", h.Create)

	body, _ := json.Marshal(map[string]interface{}{
		"recipientName": "John Doe",
		"recipientAddress": "123 Main St",
		"recipientPhone": "555-0100",
		"origin": "NYC",
		"destination": "LAX",
		"weight": 10.5,
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 for missing user context, got %d", w.Code)
	}
}

func TestUpdateStatus_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.PATCH("/waybills/:id/status", h.UpdateStatus)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/waybills/123/status", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestUpdateStatus_MissingStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.PATCH("/waybills/:id/status", h.UpdateStatus)

	body, _ := json.Marshal(map[string]string{
		"location": "Warehouse A",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/waybills/123/status", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing status, got %d", w.Code)
	}
}

func TestListWaybills_NoAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.GET("/waybills", h.List)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}

func TestGetWaybill_NoAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.GET("/waybills/:id", h.Get)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills/123", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 when repo is nil, got %d", w.Code)
	}
}

func TestTrackWaybill_NoAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()
	r.GET("/track/:trackingNumber", h.Track)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/track/WBT-ABC123", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 when repo is nil, got %d", w.Code)
	}
}

func TestCreateWaybill_EmptyBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewWaybillHandler(nil, nil, nil)
	r := gin.New()

	r.POST("/waybills", func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Set("userName", "Test Shipper")
		c.Next()
	}, h.Create)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/waybills", nil)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty body, got %d", w.Code)
	}
}