package handlers

import "github.com/gin-gonic/gin"

// reqID extracts the request ID set by the RequestLogger middleware.
func reqID(c *gin.Context) string {
	id, _ := c.Get("request_id")
	s, _ := id.(string)
	return s
}
