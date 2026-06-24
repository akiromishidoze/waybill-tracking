package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

func testToken(secret, role string) string {
	claims := jwt.MapClaims{"sub": "u1", "role": role, "exp": time.Now().Add(time.Hour).Unix()}
	t, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	return t
}

func wsServer(secret string) *httptest.Server {
	h := NewWSHandler(ws.NewHub(), nil, secret)
	return httptest.NewServer(http.HandlerFunc(h.HandleWebSocket))
}

func TestWSHandler_MissingToken(t *testing.T) {
	s := wsServer("secret")
	defer s.Close()
	_, resp, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(s.URL, "http"), nil)
	if err == nil {
		t.Fatal("expected dial error")
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestWSHandler_InvalidToken(t *testing.T) {
	s := wsServer("secret")
	defer s.Close()
	url := "ws" + strings.TrimPrefix(s.URL, "http") + "?token=bad"
	_, resp, err := websocket.DefaultDialer.Dial(url, nil)
	if err == nil {
		t.Fatal("expected dial error")
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestWSHandler_ValidToken(t *testing.T) {
	secret := "secret"
	s := wsServer(secret)
	defer s.Close()
	url := "ws" + strings.TrimPrefix(s.URL, "http") + "?token=" + testToken(secret, "ADMIN")
	conn, resp, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer conn.Close()
	if resp.StatusCode != http.StatusSwitchingProtocols {
		t.Fatalf("expected 101, got %d", resp.StatusCode)
	}
}
