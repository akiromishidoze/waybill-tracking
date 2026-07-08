package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPODHandler_NewHandler(t *testing.T) {
	h := NewPODHandler(nil, nil)
	if h == nil {
		t.Fatal("expected non-nil handler")
	}
	if h.waybillRepo != nil {
		t.Error("expected nil waybillRepo")
	}
	if h.db != nil {
		t.Error("expected nil db")
	}
}

func TestPODHandler_GeneratePOD_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewPODHandler(nil, nil)
	r := gin.New()
	r.GET("/waybills/:id/pod", func(c *gin.Context) {
		c.Set("userID", "u1")
		c.Set("userRole", "ADMIN")
		h.GeneratePOD(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills/wb1/pod", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repos are nil, got %d", w.Code)
	}
}
