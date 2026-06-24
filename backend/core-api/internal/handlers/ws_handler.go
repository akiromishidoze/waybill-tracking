package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/waybill-tracking/core-api/internal/repository"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub       *ws.Hub
	repo      *repository.WaybillRepository
	jwtSecret string
}

func NewWSHandler(hub *ws.Hub, repo *repository.WaybillRepository, jwtSecret string) *WSHandler {
	return &WSHandler{hub: hub, repo: repo, jwtSecret: jwtSecret}
}

func extractToken(r *http.Request) string {
	if token := r.URL.Query().Get("token"); token != "" {
		return token
	}
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}

func (h *WSHandler) validateToken(tokenStr string) (jwt.MapClaims, bool) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"HS256"}))
	token, err := parser.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	return claims, ok
}

func (h *WSHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	tokenStr := extractToken(r)
	if tokenStr == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"missing token"}`))
		return
	}

	claims, ok := h.validateToken(tokenStr)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"invalid or expired token"}`))
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	client := &ws.Client{
		Conn:          conn,
		Subscriptions: make(map[string]bool),
		UserID:        claims["sub"].(string),
		UserRole:      claims["role"].(string),
	}

	h.hub.Register(client)

	defer func() {
		h.hub.Unregister(client)
		conn.Close()
	}()

	for {
		_, msg, err := conn.ReadMessage()

		if err != nil {
			break
		}

		var req struct {
			Action         string `json:"action"`
			TrackingNumber string `json:"trackingNumber"`
		}

		if json.Unmarshal(msg, &req) != nil {
			continue
		}

		switch req.Action {
		case "subscribe":
			client.Subscribe(req.TrackingNumber)
		case "unsubscribe":
			client.Unsubscribe(req.TrackingNumber)
		}
	}
}
