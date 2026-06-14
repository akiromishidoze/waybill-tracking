package websocket

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn           *websocket.Conn
	Subscriptions  map[string]bool
	mu             sync.Mutex
}

type Hub struct {
	clients map[*Client]bool
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{clients: make(map[*Client]bool)}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client] = true
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, client)
}

func (h *Hub) BroadcastWaybillUpdate(trackingNumber string, data interface{}) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type": "waybill_update",
		"trackingNumber": trackingNumber,
		"data": data,
	})

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		client.mu.Lock()
		if client.Subscriptions[trackingNumber] {
			client.Conn.WriteMessage(websocket.TextMessage, msg)
		}
		client.mu.Unlock()
	}
}
