package handlers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	"github.com/waybill-tracking/core-api/internal/apierror"
	"github.com/waybill-tracking/core-api/internal/password"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/utils"
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
		"jti":   uuid.New().String(),
		"sub":   userID,
		"email": email,
		"name":  name,
		"role":  role,
		"iat":   time.Now().Unix(),
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
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if msg := utils.ValidatePassword(req.Password); msg != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}

		if !validRoles[req.Role] {
			apierror.BadRequestJSON(c, "invalid role")
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to hash password"))
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
			apierror.ConflictJSON(c, "email already registered")
			return
		}

		respondWithToken(c, jwtSecret, userID, req.Email, req.Name, req.Role, req.Company)
	}
}

func LoginHandler(jwtSecret string, db *pgxpool.Pool, rdb *redis.Client, auditLogger *repository.AuditLogger) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if utils.IsAccountLocked(c.Request.Context(), rdb, req.Email) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "account temporarily locked due to failed login attempts, try again later"})
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
			apierror.UnauthorizedJSON(c, "invalid credentials")
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
			utils.RecordFailedLogin(c.Request.Context(), rdb, req.Email)
			auditLogger.Log(c.Request.Context(), user.ID, user.Name, user.Role,
				"USER_LOGIN_FAILED", "user", user.ID, "Failed login attempt", c.ClientIP())
			apierror.UnauthorizedJSON(c, "invalid credentials")
			return
		}

		utils.ClearFailedLogin(c.Request.Context(), rdb, req.Email)

		claims := jwt.MapClaims{
			"jti":   uuid.New().String(),
			"sub":   user.ID,
			"email": user.Email,
			"role":  user.Role,
			"iat":   time.Now().Unix(),
			"exp":   time.Now().Add(24 * time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenStr, _ := token.SignedString([]byte(jwtSecret))

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		auditLogger.Log(c.Request.Context(), user.ID, user.Name, user.Role,
			"USER_LOGIN", "user", user.ID, "User logged in", c.ClientIP())

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
			apierror.NotFoundJSON(c, "user not found")
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
			apierror.InternalJSON(c, err)
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
				apierror.InternalJSON(c, err)
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
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if msg := utils.ValidatePassword(req.NewPassword); msg != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to hash password"))
			return
		}

		_, err = db.Exec(c, `UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2`, string(hashed), req.UserID)
		if err != nil {
			apierror.NotFoundJSON(c, "user not found")
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "password updated"})
	}
}

func ForgotPasswordHandler(db *pgxpool.Pool, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email string `json:"email" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		var user struct {
			ID    string
			Email string
		}
		err := db.QueryRow(c, `SELECT id, email FROM users WHERE email=$1`, req.Email).Scan(&user.ID, &user.Email)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "if the email is registered, a reset link has been sent"})
			return
		}

		token, _, err := password.GenerateToken(c.Request.Context(), db, user.ID)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to generate reset token"))
			return
		}

		password.SendResetEmail(cfg, user.Email, token)
		c.JSON(http.StatusOK, gin.H{"message": "if the email is registered, a reset link has been sent"})
	}
}

func ResetPasswordWithTokenHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Token       string `json:"token" binding:"required"`
			NewPassword string `json:"newPassword" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if msg := utils.ValidatePassword(req.NewPassword); msg != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}

		userID, err := password.ValidateToken(c.Request.Context(), db, req.Token)
		if err != nil {
			apierror.BadRequestJSON(c, "invalid or expired token")
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to hash password"))
			return
		}

		_, err = db.Exec(c, `UPDATE users SET password=$1, password_changed_at=NOW(), updated_at=NOW() WHERE id=$2`, string(hashed), userID)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to update password"))
			return
		}

		if err := password.MarkUsed(c.Request.Context(), db, req.Token); err != nil {
			apierror.InternalJSON(c, errors.New("failed to mark token used"))
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "password updated"})
	}
}

func LogoutHandler(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || len(authHeader) < 8 {
			c.JSON(http.StatusOK, gin.H{"message": "logged out"})
			return
		}
		tokenStr := authHeader[7:]

		parser := jwt.NewParser(jwt.WithoutClaimsValidation())
		token, _, _ := parser.ParseUnverified(tokenStr, jwt.MapClaims{})
		if token != nil {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				jti, _ := claims["jti"].(string)
				if jti != "" {
					ttl := 25 * time.Hour
					if exp, ok := claims["exp"].(float64); ok {
						remaining := time.Until(time.Unix(int64(exp), 0))
						if remaining > 0 {
							ttl = remaining + time.Minute
						}
					}
					rdb.Set(context.Background(), "blocklist:jti:"+jti, "1", ttl)
				}
			}
		}
		c.JSON(http.StatusOK, gin.H{"message": "logged out"})
	}
}

func RefreshTokenHandler(jwtSecret string, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			AccessToken string `json:"accessToken" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, "missing accessToken")
			return
		}

		parser := jwt.NewParser(jwt.WithValidMethods([]string{"HS256"}))
		token, err := parser.Parse(req.AccessToken, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil {
			apierror.UnauthorizedJSON(c, "invalid token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			apierror.UnauthorizedJSON(c, "invalid token claims")
			return
		}

		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp)+7*24*3600 {
				apierror.UnauthorizedJSON(c, "token expired beyond grace period")
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
			apierror.UnauthorizedJSON(c, "user not found")
			return
		}

		company := ""
		if user.Company.Valid {
			company = user.Company.String
		}

		respondWithToken(c, jwtSecret, userID, email, user.Name, role, company)
	}
}

func UpdateUserRoleHandler(db *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req roleUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if !validRoles[req.Role] {
			apierror.BadRequestJSON(c, "invalid role")
			return
		}

		_, err := db.Exec(c, `UPDATE users SET role=$1 WHERE id=$2`, req.Role, id)
		if err != nil {
			apierror.InternalJSON(c, err)
			return
		}

		if rdb != nil {
			rdb.Set(context.Background(), "user:invalidate-before:"+id, time.Now().Unix(), 25*time.Hour)
		}

		c.JSON(http.StatusOK, gin.H{"message": "role updated"})
	}
}

func CreateUserHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req registerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			apierror.BadRequestJSON(c, err.Error())
			return
		}

		if msg := utils.ValidatePassword(req.Password); msg != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}

		if !validRoles[req.Role] {
			apierror.BadRequestJSON(c, "invalid role")
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			apierror.InternalJSON(c, errors.New("failed to hash password"))
			return
		}

		var userID string
		err = db.QueryRow(c,
			`INSERT INTO users (email, name, password, role, company) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
			req.Email, req.Name, string(hashed), req.Role, req.Company,
		).Scan(&userID)
		if err != nil {
			apierror.ConflictJSON(c, "email already registered")
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":      userID,
			"email":   req.Email,
			"name":    req.Name,
			"role":    req.Role,
			"company": req.Company,
		})
	}
}

func DeleteUserHandler(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		adminID, _ := c.Get("userID")
		if adminID == id {
			apierror.BadRequestJSON(c, "cannot delete yourself")
			return
		}

		res, err := db.Exec(c, `DELETE FROM users WHERE id=$1`, id)
		if err != nil {
			if strings.Contains(err.Error(), "23503") {
				apierror.ConflictJSON(c, "cannot delete user with associated records; reassign or remove related waybills first")
				return
			}
			apierror.InternalJSON(c, err)
			return
		}

		if res.RowsAffected() == 0 {
			apierror.NotFoundJSON(c, "user not found")
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
	}
}
