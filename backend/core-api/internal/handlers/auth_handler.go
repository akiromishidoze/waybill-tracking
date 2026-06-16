package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type registerRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=SHIPPER COURIER OPS ADMIN"`
	Company  string `json:"company"`
}

func respondWithToken(c *gin.Context, jwtSecret, id, email, name, role, company string) {
	claims := jwt.MapClaims{
		"sub":   id,
		"email": email,
		"name":  name,
		"role":  role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(jwtSecret))

	c.JSON(http.StatusOK, gin.H{
		"accessToken": tokenStr,
		"user": gin.H{
			"id":      id,
			"email":   email,
			"name":    name,
			"role":    role,
			"company": company,
		},
	})
}

func RegisterHandler(jwtSecret string, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req registerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}

		var id string
		err = db.QueryRow(c,
			`INSERT INTO users (email, name, password, role, company) VALUES ($1,$2,$3,$4,$5)
			 RETURNING id`,
			req.Email, req.Name, string(hash), req.Role, req.Company,
		).Scan(&id)
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}

		respondWithToken(c, jwtSecret, id, req.Email, req.Name, req.Role, req.Company)
	}
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

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		respondWithToken(c, jwtSecret, user.ID, user.Email, user.Name, user.Role, company)
	}
}
