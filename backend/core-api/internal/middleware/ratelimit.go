package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"
)

type fallbackEntry struct {
	count int64
}

var fallbackStore sync.Map

func fallbackIncr(key string, window time.Duration) int64 {
	entry := &fallbackEntry{}
	actual, loaded := fallbackStore.LoadOrStore(key, entry)
	e := actual.(*fallbackEntry)
	count := atomic.AddInt64(&e.count, 1)
	if !loaded {
		time.AfterFunc(window, func() { fallbackStore.Delete(key) })
	}
	return count
}

func RateLimitMiddleware(rdb *redis.Client, maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := "ratelimit:" + ip + ":" + c.FullPath()

		count, err := rdb.Incr(c, key).Result()

		if err != nil {
			logger.L().Warn("rate limiter: Redis unavailable, using in-process fallback",
				zap.String("key", key), zap.Error(err))
			count = fallbackIncr(key, window)
		} else if count == 1 {
			rdb.Expire(c, key, window)
		}

		remaining := maxRequests - int(count)
		if remaining < 0 {
			remaining = 0
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if count > int64(maxRequests) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded, try again later",
			})

			return
		}

		c.Next()
	}
}
