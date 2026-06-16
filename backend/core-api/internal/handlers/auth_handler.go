package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func LoginHandler(jwtSecret string, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user struct {
			ID       string
			Email    string
			Name     string
			Password string
			Role     string
			Company  sql.NullString
		}
		err := db.QueryRow(c, `SELECT id, email, name, password, role, company FROM users WHERE email=$1`, req.Email).Scan(
			&user.ID, &user.Email, &user.Name, &user.Password, &user.Role, &user.Company,
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		claims := jwt.MapClaims{
			"sub":   user.ID,
			"email": user.Email,
			"role":  user.Role,
			"exp":   time.Now().Add(24 * time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenStr, _ := token.SignedString([]byte(jwtSecret))

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		c.JSON(http.StatusOK, gin.H{
			"accessToken": tokenStr,
			"user": gin.H{
				"id":      user.ID,
				"email":   user.Email,
				"name":    user.Name,
				"role":    user.Role,
				"company": company,
			},
		})
	}
}
