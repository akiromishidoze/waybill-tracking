package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func podTestToken(secret string) string {
	claims := jwt.MapClaims{"sub": "u1", "role": "ADMIN", "exp": time.Now().Add(time.Hour).Unix()}
	t, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	return t
}

func TestPODHandler_NewHandler(t *testing.T) {
	h := NewPODHandler(nil, nil, "secret")
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

func TestPODHandler_GeneratePOD_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewPODHandler(nil, nil, "secret")
	r := gin.New()
	r.GET("/waybills/:id/pod", h.GeneratePOD)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills/wb1/pod", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without token, got %d", w.Code)
	}
}

func TestPODHandler_GeneratePOD_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewPODHandler(nil, nil, "secret")
	r := gin.New()
	r.GET("/waybills/:id/pod", h.GeneratePOD)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills/wb1/pod", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 with invalid token, got %d", w.Code)
	}
}

func TestPODHandler_GeneratePOD_NilRepo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewPODHandler(nil, nil, "secret")
	r := gin.New()
	r.GET("/waybills/:id/pod", h.GeneratePOD)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/waybills/wb1/pod", nil)
	req.Header.Set("Authorization", "Bearer "+podTestToken("secret"))
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when repos are nil, got %d", w.Code)
	}
}
