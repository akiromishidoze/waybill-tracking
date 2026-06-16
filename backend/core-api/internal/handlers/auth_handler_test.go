package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRegisterHandler_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestRegisterHandler_MissingEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"password": "password123",
		"name":     "Test User",
		"role":     "SHIPPER",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing email, got %d", w.Code)
	}
}

func TestRegisterHandler_MissingPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"email": "test@example.com",
		"name":  "Test User",
		"role":  "SHIPPER",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing password, got %d", w.Code)
	}
}

func TestRegisterHandler_ShortPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"email":    "test@example.com",
		"password": "12345",
		"name":     "Test User",
		"role":     "SHIPPER",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for short password, got %d", w.Code)
	}
}

func TestRegisterHandler_MissingName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"email":    "test@example.com",
		"password": "password123",
		"role":     "SHIPPER",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing name, got %d", w.Code)
	}
}

func TestRegisterHandler_InvalidRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"email":    "test@example.com",
		"password": "password123",
		"name":     "Test User",
		"role":     "INVALID_ROLE",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid role, got %d", w.Code)
	}
}

func TestLoginHandler_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/login", LoginHandler("secret", nil))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestLoginHandler_MissingEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/login", LoginHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"password": "password123",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing email, got %d", w.Code)
	}
}

func TestLoginHandler_MissingPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/login", LoginHandler("secret", nil))

	body, _ := json.Marshal(map[string]string{
		"email": "test@example.com",
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing password, got %d", w.Code)
	}
}

func TestRespondWithToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	respondWithToken(c, "secret", "user-1", "test@example.com", "Test User", "ADMIN", "ACME Inc")

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if _, ok := resp["accessToken"]; !ok {
		t.Error("response missing accessToken")
	}

	user, ok := resp["user"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing user object")
	}

	if user["id"] != "user-1" {
		t.Errorf("expected user.id user-1, got %v", user["id"])
	}
	if user["email"] != "test@example.com" {
		t.Errorf("expected user.email test@example.com, got %v", user["email"])
	}
	if user["role"] != "ADMIN" {
		t.Errorf("expected user.role ADMIN, got %v", user["role"])
	}
	if user["company"] != "ACME Inc" {
		t.Errorf("expected user.company ACME Inc, got %v", user["company"])
	}
}

func TestRegisterHandler_NoContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/register", RegisterHandler("secret", nil))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/register", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for no content type, got %d", w.Code)
	}
}

func TestLoginHandler_NoContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/login", LoginHandler("secret", nil))

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for no content type, got %d", w.Code)
	}
}
