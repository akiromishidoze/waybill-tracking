package websocket

import (
	"testing"
	"time"

	gorillaws "github.com/gorilla/websocket"
)

func TestNewHub(t *testing.T) {
	h := NewHub()

	if h == nil {
		t.Fatal("expected non-nil hub")
	}

	if len(h.clients) != 0 {
		t.Errorf("expected empty clients map, got %d", len(h.clients))
	}
}

func TestRegisterClient(t *testing.T) {
	h := NewHub()
	c := &Client{
		Subscriptions: make(map[string]bool),
	}

	h.Register(c)

	if len(h.clients) != 1 {
		t.Errorf("expected 1 client, got %d", len(h.clients))
	}
}

func TestUnregisterClient(t *testing.T) {
	h := NewHub()
	c := &Client{
		Subscriptions: make(map[string]bool),
	}

	h.Register(c)
	h.Unregister(c)

	if len(h.clients) != 0 {
		t.Errorf("expected 0 clients after unregister, got %d", len(h.clients))
	}
}

func TestRegisterDuplicateClient(t *testing.T) {
	h := NewHub()

	c := &Client{
		Subscriptions: make(map[string]bool),
	}

	h.Register(c)
	h.Register(c)

	if len(h.clients) != 1 {
		t.Errorf("expected 1 client (deduped), got %d", len(h.clients))
	}
}

func TestUnregisterNonexistentClient(t *testing.T) {
	h := NewHub()
	c := &Client{
		Subscriptions: make(map[string]bool),
	}

	h.Unregister(c)

	if len(h.clients) != 0 {
		t.Errorf("expected 0 clients, got %d", len(h.clients))
	}
}

func TestBroadcastWithNoClients(t *testing.T) {
	h := NewHub()
	h.BroadcastWaybillUpdate("WBT-001", map[string]string{"status": "DELIVERED"})
}

func TestBroadcastWithNoSubscriptions(t *testing.T) {
	h := NewHub()
	_, s, err := gorillaws.DefaultDialer.Dial("ws://localhost:0", nil)
	if err == nil {
		defer s.Close()
	}
	_ = s

	h2 := NewHub()
	c := &Client{
		Subscriptions: make(map[string]bool),
	}
	h2.Register(c)
	h2.BroadcastWaybillUpdate("WBT-001", map[string]string{"status": "DELIVERED"})
}

func TestConcurrentRegisterAndBroadcast(t *testing.T) {
	h := NewHub()
	done := make(chan bool)

	go func() {
		for i := 0; i < 100; i++ {
			c := &Client{Subscriptions: make(map[string]bool)}
			h.Register(c)
		}
		done <- true
	}()

	go func() {
		for i := 0; i < 100; i++ {
			h.BroadcastWaybillUpdate("WBT-001", map[string]string{"status": "IN_TRANSIT"})
		}
		done <- true
	}()

	<-done
	<-done

	h.mu.RLock()
	count := len(h.clients)
	h.mu.RUnlock()
	if count != 100 {
		t.Errorf("expected 100 clients, got %d", count)
	}
}

func TestHubRaceRegisterUnregister(t *testing.T) {
	h := NewHub()
	done := make(chan bool)

	go func() {
		for i := 0; i < 50; i++ {
			c := &Client{Subscriptions: make(map[string]bool)}
			h.Register(c)
			h.Unregister(c)
		}
		done <- true
	}()

	go func() {
		for i := 0; i < 50; i++ {
			c := &Client{Subscriptions: make(map[string]bool)}
			h.Register(c)
		}
		done <- true
	}()

	<-done
	<-done
}

func TestNewClient(t *testing.T) {
	c := &Client{
		Subscriptions: make(map[string]bool),
	}
	if c.Conn != nil {
		t.Error("expected nil connection for new client")
	}
	if len(c.Subscriptions) != 0 {
		t.Errorf("expected empty subscriptions, got %d", len(c.Subscriptions))
	}
}

func TestClientSubscription(t *testing.T) {
	c := &Client{
		Subscriptions: make(map[string]bool),
	}
	c.Subscriptions["WBT-001"] = true
	if !c.Subscriptions["WBT-001"] {
		t.Error("expected subscription to be set")
	}
	if c.Subscriptions["WBT-002"] {
		t.Error("expected WBT-002 to not be subscribed")
	}
}

func TestHubConcurrentAccess(t *testing.T) {
	h := NewHub()
	done := make(chan bool, 3)

	for i := 0; i < 3; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				c := &Client{Subscriptions: map[string]bool{
					"WBT-001": true,
				}}
				h.Register(c)
				h.BroadcastWaybillUpdate("WBT-001", j)
				h.Unregister(c)
			}
			done <- true
		}()
	}

	for i := 0; i < 3; i++ {
		<-done
	}
}

func init() {
	// Disable gorilla/websocket logging in tests
	_ = time.Now
}
