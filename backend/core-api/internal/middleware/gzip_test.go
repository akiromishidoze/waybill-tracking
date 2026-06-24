package middleware

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGzip_CompressesLargeResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, strings.Repeat("a", 2048))
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Encoding") != "gzip" {
		t.Errorf("expected gzip content encoding, got %s", w.Header().Get("Content-Encoding"))
	}
	if w.Header().Get("Vary") != "Accept-Encoding" {
		t.Errorf("expected Vary header Accept-Encoding, got %s", w.Header().Get("Vary"))
	}

	reader, err := gzip.NewReader(w.Body)
	if err != nil {
		t.Fatalf("expected gzip reader, got error: %v", err)
	}
	defer reader.Close()
	body, _ := io.ReadAll(reader)
	if len(body) != 2048 {
		t.Errorf("expected decompressed length 2048, got %d", len(body))
	}
}

func TestGzip_SkipsSmallResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Encoding") == "gzip" {
		t.Error("expected small response not to be gzip encoded")
	}
	if w.Body.String() != "ok" {
		t.Errorf("expected body 'ok', got %q", w.Body.String())
	}
}

func TestGzip_SkipsWithoutAcceptEncoding(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, strings.Repeat("a", 2048))
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Header().Get("Content-Encoding") == "gzip" {
		t.Error("expected response not to be gzip encoded without Accept-Encoding header")
	}
}
