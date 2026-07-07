package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCarrierRateHandler_NewHandler(t *testing.T) {
	h := NewCarrierRateHandler(nil)
	if h == nil {
		t.Fatal("expected non-nil handler")
	}
	if h.repo != nil {
		t.Error("expected nil repo")
	}
}

func TestCarrierRateHandler_ListByCarrier_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.GET("/carriers/:carrierId/rates", h.ListByCarrier)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/carriers/c1/rates", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Create_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.POST("/carriers/:carrierId/rates", h.Create)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/carriers/c1/rates", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Create_MissingServiceType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.POST("/carriers/:carrierId/rates", h.Create)

	body, _ := json.Marshal(map[string]float64{
		"baseRate": 100,
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/carriers/c1/rates", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing service type, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Update_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.PATCH("/rates/:rateId", h.Update)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/rates/r1", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Delete_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.DELETE("/rates/:rateId", h.Delete)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/rates/r1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Compare_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.GET("/rates/compare", h.Compare)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/rates/compare?serviceType=STANDARD&origin=NYC&destination=LAX&weight=2.5", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}

func TestCarrierRateHandler_Compare_InvalidWeight(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarrierRateHandler(nil)
	r := gin.New()
	r.GET("/rates/compare", h.Compare)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/rates/compare?serviceType=STANDARD&origin=NYC&destination=LAX&weight=not-a-number", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}
