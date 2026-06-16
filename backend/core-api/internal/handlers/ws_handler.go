package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"github.com/waybill-tracking/core-api/internal/repository"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub *ws.Hub
	repo *repository.WaybillRepository
}

func NewWSHandler(hub *ws.Hub, repo *repository.WaybillRepository) *WSHandler {
	return &WSHandler{hub: hub, repo: repo}
}

func (h *WSHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Printf("ws upgrade error: %v", err)

		return
	}

	client := &ws.Client{
		Conn:          conn,
		Subscriptions: make(map[string]bool),
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
			client.mu.Lock()
			client.Subscriptions[req.TrackingNumber] = true
			client.mu.Unlock()
		case "unsubscribe":
			client.mu.Lock()
			delete(client.Subscriptions, req.TrackingNumber)
			client.mu.Unlock()
		}
	}
}