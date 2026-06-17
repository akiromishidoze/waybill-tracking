package feature

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, All())
	}
}

func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("features", All())
		c.Next()
	}
}
