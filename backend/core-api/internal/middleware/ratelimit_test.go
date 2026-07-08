package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func TestRateLimitMiddleware_FallbackEnforcesLimitWhenRedisDown(t *testing.T) {
	gin.SetMode(gin.TestMode)
	fallbackStore.Clear()

	// Redis is unreachable — the middleware must fall back to in-process tracking.
	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:0"})
	defer rdb.Close()

	r := gin.New()
	r.GET("/test", RateLimitMiddleware(rdb, 1, time.Minute), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		r.ServeHTTP(w, req)
		if i == 0 && w.Code != http.StatusOK {
			t.Fatalf("expected 200 on first request, got %d", w.Code)
		}
		if i == 1 && w.Code != http.StatusTooManyRequests {
			t.Fatalf("expected 429 on second request with Redis down, got %d", w.Code)
		}
	}
}

func TestRateLimitMiddleware_SetsHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	fallbackStore.Clear()

	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:0"})
	defer rdb.Close()

	r := gin.New()
	r.GET("/test", RateLimitMiddleware(rdb, 5, time.Minute), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Header().Get("X-RateLimit-Limit") != "5" {
		t.Errorf("expected X-RateLimit-Limit 5, got %s", w.Header().Get("X-RateLimit-Limit"))
	}
	if w.Header().Get("X-RateLimit-Remaining") != "4" {
		t.Errorf("expected X-RateLimit-Remaining 4, got %s", w.Header().Get("X-RateLimit-Remaining"))
	}
}
