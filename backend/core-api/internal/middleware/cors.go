package middleware

import (
	"net/http"
	"os"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"
)

// CORSMiddleware configures Cross-Origin Resource Sharing.
//
// Production rules (GIN_MODE=release):
//   - Wildcard "*" is rejected at startup.
//   - Only exact-match origins from allowedOrigins are reflected.
//   - Access-Control-Allow-Credentials is set to "true" for credentialed requests.
func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	// Trim whitespace introduced by comma-split of env vars.
	normalized := make([]string, 0, len(allowedOrigins))
	allowAll := false
	for _, o := range allowedOrigins {
		o = strings.TrimSpace(o)
		if o == "*" {
			allowAll = true
		}
		normalized = append(normalized, o)
	}

	if allowAll {
		if gin.Mode() == gin.ReleaseMode {
			// Hard-fail: wildcard CORS is never acceptable in production.
			logger.L().Fatal(
				"FATAL: ALLOWED_ORIGINS contains '*' which is forbidden in production (GIN_MODE=release). "+
					"Set ALLOWED_ORIGINS to an explicit list of trusted origins.",
			)
			os.Exit(1)
		}
		logger.L().Warn(
			"CORS is configured with wildcard '*' – this is insecure and must not be used in production",
			zap.Strings("allowed_origins", normalized),
		)
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		if origin != "" {
			if allowAll {
				// In non-release mode reflect the actual origin so credentials work.
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			} else if slices.Contains(normalized, origin) {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
				c.Header("Access-Control-Allow-Credentials", "true")
			}
			// Origins not in the allow-list receive no CORS headers (browser blocks the request).
		}

		if c.Request.Method == http.MethodOptions {
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
			c.Header("Access-Control-Max-Age", "86400")
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
