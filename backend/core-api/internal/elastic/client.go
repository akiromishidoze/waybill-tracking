package elastic

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/waybill-tracking/core-api/internal/models"
)

const waybillIndex = "waybills"

type Client struct {
	es *elasticsearch.Client
}

func NewClient(url string) *Client {
	cfg := elasticsearch.Config{
		Addresses: []string{url},
	}
	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		log.Fatalf("failed to create elasticsearch client: %v", err)
	}
	return &Client{es: es}
}

func (c *Client) IndexWaybill(ctx context.Context, wb *models.Waybill) error {
	body, err := json.Marshal(wb)
	if err != nil {
		return fmt.Errorf("marshal waybill: %w", err)
	}

	res, err := c.es.Index(waybillIndex, bytes.NewReader(body),
		c.es.Index.WithDocumentID(wb.ID),
		c.es.Index.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("index waybill: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("es index error: %s", res.String())
	}

	log.Printf("indexed waybill %s in elasticsearch", wb.ID)
	return nil
}

func (c *Client) Ping(ctx context.Context) error {
	res, err := c.es.Ping(c.es.Ping.WithContext(ctx))
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		return fmt.Errorf("es ping error: %s", res.String())
	}
	return nil
}
