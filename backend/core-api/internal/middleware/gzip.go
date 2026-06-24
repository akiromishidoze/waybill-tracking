package middleware

import (
	"bytes"
	"compress/gzip"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const gzipMinLength = 1024

// Gzip compresses responses using gzip when the client accepts it and the
// response body is large enough to benefit from compression. Responses smaller
// than gzipMinLength are written uncompressed.
func Gzip() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}

		if c.GetHeader("Upgrade") != "" || c.GetHeader("Sec-WebSocket-Key") != "" {
			c.Next()
			return
		}

		grw := &gzipResponseWriter{
			ResponseWriter: c.Writer,
			buf:            &bytes.Buffer{},
			status:         http.StatusOK,
		}
		c.Writer = grw
		c.Header("Vary", "Accept-Encoding")
		c.Next()

		body := grw.buf.Bytes()
		grw.ResponseWriter.Header().Del("Content-Length")

		if len(body) < gzipMinLength || grw.status >= http.StatusBadRequest {
			grw.ResponseWriter.Header().Del("Content-Encoding")
			grw.ResponseWriter.WriteHeader(grw.status)
			_, _ = grw.ResponseWriter.Write(body)
			return
		}

		grw.ResponseWriter.Header().Set("Content-Encoding", "gzip")
		grw.ResponseWriter.WriteHeader(grw.status)
		gz := gzip.NewWriter(grw.ResponseWriter)
		_, _ = gz.Write(body)
		_ = gz.Close()
	}
}

type gzipResponseWriter struct {
	gin.ResponseWriter
	buf           *bytes.Buffer
	status        int
	headerWritten bool
}

func (g *gzipResponseWriter) Write(data []byte) (int, error) {
	return g.buf.Write(data)
}

func (g *gzipResponseWriter) WriteHeader(code int) {
	if !g.headerWritten {
		g.status = code
		g.headerWritten = true
	}
}

func (g *gzipResponseWriter) WriteString(s string) (int, error) {
	return g.Write([]byte(s))
}
