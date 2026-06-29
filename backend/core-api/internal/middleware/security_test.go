package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func newSecurityRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(SecurityHeaders())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})
	return r
}

func TestSecurityHeaders(t *testing.T) {
	r := newSecurityRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	for header, expected := range map[string]string{
		"X-Content-Type-Options":        "nosniff",
		"X-Frame-Options":               "DENY",
		"X-XSS-Protection":              "0",
		"Referrer-Policy":               "strict-origin-when-cross-origin",
		"Cross-Origin-Opener-Policy":    "same-origin",
		"Cross-Origin-Resource-Policy":  "same-origin",
	} {
		if got := w.Header().Get(header); got != expected {
			t.Errorf("expected %s=%q, got %q", header, expected, got)
		}
	}

	if csp := w.Header().Get("Content-Security-Policy"); csp == "" {
		t.Error("expected Content-Security-Policy header to be set")
	}

	if hsts := w.Header().Get("Strict-Transport-Security"); hsts != "" {
		t.Error("HSTS must not be set on plain HTTP without X-Forwarded-Proto")
	}
}

func TestSecurityHeaders_HSTSViaProxy(t *testing.T) {
	r := newSecurityRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Forwarded-Proto", "https")
	r.ServeHTTP(w, req)

	if hsts := w.Header().Get("Strict-Transport-Security"); hsts != hstsValue {
		t.Errorf("expected HSTS=%q via proxy, got %q", hstsValue, hsts)
	}
}

func TestSecurityHeaders_NoHSTSOnHTTP(t *testing.T) {
	r := newSecurityRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if hsts := w.Header().Get("Strict-Transport-Security"); hsts != "" {
		t.Errorf("HSTS must not be set on plain HTTP, got %q", hsts)
	}
}
