package middleware

import (
	"github.com/gin-gonic/gin"
)

const (
	defaultCSP  = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:;"
	hstsValue   = "max-age=63072000; includeSubDomains; preload"
)

// isSecureRequest returns true when the connection is TLS-terminated, either
// directly (c.Request.TLS != nil) or via a reverse-proxy that sets
// X-Forwarded-Proto: https.
func isSecureRequest(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}
	return c.GetHeader("X-Forwarded-Proto") == "https"
}

// setCommonSecurityHeaders writes headers that are safe on every response.
func setCommonSecurityHeaders(c *gin.Context, csp string) {
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("X-Frame-Options", "DENY")
	c.Header("X-XSS-Protection", "0") // Modern browsers ignore this; set to 0 to avoid XSS auditor bugs.
	c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
	c.Header("Content-Security-Policy", csp)
	c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")
	c.Header("Cross-Origin-Opener-Policy", "same-origin")
	c.Header("Cross-Origin-Resource-Policy", "same-origin")
	if isSecureRequest(c) {
		c.Header("Strict-Transport-Security", hstsValue)
	}
}

// SecurityHeaders adds common HTTP security headers to every response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		setCommonSecurityHeaders(c, defaultCSP)
		c.Next()
	}
}

// SecurityHeadersConfig allows customizing the security headers.
type SecurityHeadersConfig struct {
	CSP string
}

// SecurityHeadersWithConfig returns a middleware that adds security headers with a custom CSP.
func SecurityHeadersWithConfig(config SecurityHeadersConfig) gin.HandlerFunc {
	csp := config.CSP
	if csp == "" {
		csp = defaultCSP
	}

	return func(c *gin.Context) {
		setCommonSecurityHeaders(c, csp)
		c.Next()
	}
}

// NoSniff is a focused middleware that only sets X-Content-Type-Options.
func NoSniff() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Next()
	}
}
