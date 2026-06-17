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

type roleUpdateRequest struct {
	Role string `json:"role" binding:"required"`
}

var validRoles = map[string]bool{
	"SHIPPER": true,
	"COURIER": true,
	"OPS":     true,
	"ADMIN":   true,
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

func MeHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var user struct {
			ID      string
			Email   string
			Name    string
			Role    string
			Company sql.NullString
		}
		err := db.QueryRow(c, `SELECT id, email, name, role, company FROM users WHERE id=$1`, userID).Scan(
			&user.ID, &user.Email, &user.Name, &user.Role, &user.Company,
		)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		c.JSON(http.StatusOK, gin.H{
			"id":      user.ID,
			"email":   user.Email,
			"name":    user.Name,
			"role":    user.Role,
			"company": company,
		})
	}
}

func ListUsersHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(c, `SELECT id, email, name, role, COALESCE(company,'') FROM users ORDER BY name`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type userResponse struct {
			ID      string `json:"id"`
			Email   string `json:"email"`
			Name    string `json:"name"`
			Role    string `json:"role"`
			Company string `json:"company"`
		}

		users := []userResponse{}
		for rows.Next() {
			var u userResponse
			if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.Company); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			users = append(users, u)
		}
		c.JSON(http.StatusOK, users)
	}
}

func UpdateUserRoleHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req roleUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if !validRoles[req.Role] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
			return
		}

		_, err := db.Exec(c, `UPDATE users SET role=$1 WHERE id=$2`, req.Role, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "role updated"})
	}
}
