package middleware

import (
	"log"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader("X-Request-ID")

		if reqID == "" {
			reqID = uuid.New().String()
		}

		c.Set("request_id", reqID)
		c.Header("X-Request-ID", reqID)

		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		status := c.Writer.Status()
		duration := time.Since(start)

		log.Printf("[%s] %s %s -> %d (%s)", reqID, method, path, status, duration)
	}
}