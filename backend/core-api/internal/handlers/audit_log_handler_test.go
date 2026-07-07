package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAuditLogHandler_NewHandler(t *testing.T) {
	h := NewAuditLogHandler(nil)
	if h == nil {
		t.Fatal("expected non-nil handler")
	}
	if h.repo != nil {
		t.Error("expected nil repo")
	}
}

func TestAuditLogHandler_List_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAuditLogHandler(nil)
	r := gin.New()
	r.GET("/audit-logs", h.List)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/audit-logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}

func TestAuditLogHandler_Export_InvalidFromDate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAuditLogHandler(nil)
	r := gin.New()
	r.GET("/audit-logs/export", h.Export)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/audit-logs/export?from=not-a-date", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid 'from' date, got %d", w.Code)
	}
}

func TestAuditLogHandler_Export_InvalidToDate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAuditLogHandler(nil)
	r := gin.New()
	r.GET("/audit-logs/export", h.Export)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/audit-logs/export?to=not-a-date", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid 'to' date, got %d", w.Code)
	}
}

func TestAuditLogHandler_Export_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAuditLogHandler(nil)
	r := gin.New()
	r.GET("/audit-logs/export", h.Export)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/audit-logs/export", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repo is nil, got %d", w.Code)
	}
}
