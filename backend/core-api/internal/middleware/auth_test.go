package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_InvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Invalid")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_InvalidBearerPrefix(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Basic sometoken")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_WrongSigningMethod(t *testing.T) {
	gin.SetMode(gin.TestMode)
	token := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"sub": "user-1",
		"role": "ADMIN",
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	})

	tokenStr, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)

	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for none-signed token, got %d", w.Code)
	}
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "user-1",
		"role": "ADMIN",
		"exp": time.Now().Add(-1 * time.Hour).Unix(),
	})

	tokenStr, _ := token.SignedString([]byte("secret"))

	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired token, got %d", w.Code)
	}
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	claims := jwt.MapClaims{
		"sub": "user-1",
		"role": "ADMIN",
		"name": "Test User",
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("secret"))

	r := gin.New()
	r.GET("/test", AuthMiddleware("secret"), func(c *gin.Context) {
		uid, _ := c.Get("userID")
		role, _ := c.Get("userRole")
		name, _ := c.Get("userName")
		c.JSON(http.StatusOK, gin.H{
			"userID": uid,
			"role": role,
			"name": name,
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestAuthMiddleware_WrongSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "user-1",
		"role": "ADMIN",
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	})

	tokenStr, _ := token.SignedString([]byte("wrong-secret"))

	r := gin.New()
	r.GET("/test", AuthMiddleware("correct-secret"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for wrong secret, got %d", w.Code)
	}
}

func TestRoleMiddleware_Allowed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", "ADMIN")
		c.Next()
	}, RoleMiddleware("ADMIN"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRoleMiddleware_Denied(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", "COURIER")
		c.Next()
	}, RoleMiddleware("ADMIN"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestRoleMiddleware_MultipleRoles_Allowed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/courier", func(c *gin.Context) {
		c.Set("userRole", "COURIER")
		c.Next()
	}, RoleMiddleware("COURIER", "ADMIN"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/courier", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRoleMiddleware_MultipleRoles_AnyAllowed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/courier", func(c *gin.Context) {
		c.Set("userRole", "ADMIN")
		c.Next()
	}, RoleMiddleware("COURIER", "ADMIN"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/courier", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 when ADMIN accesses courier route, got %d", w.Code)
	}
}

func TestRoleMiddleware_NoRoleSet(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", RoleMiddleware("ADMIN"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403 when no role set, got %d", w.Code)
	}
}