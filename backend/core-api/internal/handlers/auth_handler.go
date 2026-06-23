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

type registerRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required"`
	Company  string `json:"company"`
}

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

func respondWithToken(c *gin.Context, jwtSecret, userID, email, name, role, company string) {
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"role":  role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(jwtSecret))

	c.JSON(http.StatusOK, gin.H{
		"accessToken": tokenStr,
		"user": gin.H{
			"id":      userID,
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

		if len(req.Password) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters"})
			return
		}

		if !validRoles[req.Role] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}

		if db == nil {
			respondWithToken(c, jwtSecret, "new-user-id", req.Email, req.Name, req.Role, req.Company)
			return
		}

		var userID string
		err = db.QueryRow(c,
			`INSERT INTO users (email, name, password, role, company) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
			req.Email, req.Name, string(hashed), req.Role, req.Company,
		).Scan(&userID)
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}

		respondWithToken(c, jwtSecret, userID, req.Email, req.Name, req.Role, req.Company)
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

func ResetPasswordHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			UserID      string `json:"userId" binding:"required"`
			NewPassword string `json:"newPassword" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if len(req.NewPassword) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters"})
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}

		_, err = db.Exec(c, `UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2`, string(hashed), req.UserID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "password updated"})
	}
}

func RefreshTokenHandler(jwtSecret string, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			AccessToken string `json:"accessToken" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing accessToken"})
			return
		}

		parser := jwt.NewParser(jwt.WithValidMethods([]string{"HS256"}))
		token, err := parser.Parse(req.AccessToken, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp)+7*24*3600 {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "token expired beyond grace period"})
				return
			}
		}

		userID, _ := claims["sub"].(string)
		email, _ := claims["email"].(string)
		role, _ := claims["role"].(string)

		var user struct {
			Name    string
			Company sql.NullString
		}
		err = db.QueryRow(c, `SELECT name, company FROM users WHERE id=$1`, userID).Scan(&user.Name, &user.Company)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		respondWithToken(c, jwtSecret, userID, email, user.Name, role, company)
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
