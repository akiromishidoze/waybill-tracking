package middleware

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(secrets ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})

			return
		}

		parts := strings.Split(authHeader, " ")

		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})

			return
		}

		var claims jwt.MapClaims
		valid := false
		for _, secret := range secrets {
			if secret == "" {
				continue
			}

			token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})

			if err == nil && token.Valid {
				claims, valid = token.Claims.(jwt.MapClaims)
				if valid {
					break
				}
			}
		}

		if !valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set("userID", claims["sub"])
		c.Set("userRole", claims["role"])
		c.Set("userName", claims["name"])
		c.Next()
	}
}

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, _ := c.Get("userRole")
		for _, r := range roles {
			if r == userRole {
				c.Next()

				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}