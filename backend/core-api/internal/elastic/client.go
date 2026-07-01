package elastic

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/waybill-tracking/core-api/internal/logger"
	"github.com/waybill-tracking/core-api/internal/models"
	"go.uber.org/zap"
)

const waybillIndex = "waybills"

type Client struct {
	es *elasticsearch.Client
}

func NewClient(url, username, password string) *Client {
	cfg := elasticsearch.Config{
		Addresses: []string{url},
	}
	if username != "" {
		cfg.Username = username
		cfg.Password = password
	}
	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		logger.L().Fatal("failed to create elasticsearch client", zap.Error(err))
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

	logger.L().Debug("indexed waybill in elasticsearch", zap.String("waybill_id", wb.ID))
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

func (c *Client) CreateIndex(ctx context.Context) error {
	mapping := `{
		"mappings": {
			"properties": {
				"tracking_number": {"type": "text"},
				"shipper_name": {"type": "text"},
				"recipient_name": {"type": "text"},
				"origin": {"type": "text"},
				"destination": {"type": "text"},
				"status": {"type": "keyword"},
				"carrier_name": {"type": "text"},
				"created_at": {"type": "date"},
				"updated_at": {"type": "date"}
			}
		}
	}`
	
	res, err := c.es.Indices.Create(
		waybillIndex,
		c.es.Indices.Create.WithBody(bytes.NewReader([]byte(mapping))),
		c.es.Indices.Create.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("create index: %w", err)
	}
	defer res.Body.Close()
	
	if res.IsError() && res.StatusCode != 400 {
		return fmt.Errorf("es create index error: %s", res.String())
	}
	
	logger.L().Info("elasticsearch waybill index created or already exists")
	return nil
}

func (c *Client) SearchWaybills(ctx context.Context, query string, page, limit int) ([]models.Waybill, int64, error) {
	if query == "" {
		return nil, 0, nil
	}
	
	from := (page - 1) * limit
	searchBody := fmt.Sprintf(`{
		"query": {
			"multi_match": {
				"query": "%s",
				"fields": ["tracking_number", "shipper_name", "recipient_name", "origin", "destination", "carrier_name"],
				"fuzziness": "AUTO"
			}
		},
		"from": %d,
		"size": %d
	}`, query, from, limit)
	
	res, err := c.es.Search(
		c.es.Search.WithIndex(waybillIndex),
		c.es.Search.WithBody(bytes.NewReader([]byte(searchBody))),
		c.es.Search.WithContext(ctx),
	)
	if err != nil {
		return nil, 0, fmt.Errorf("search waybills: %w", err)
	}
	defer res.Body.Close()
	
	if res.IsError() {
		return nil, 0, fmt.Errorf("es search error: %s", res.String())
	}
	
	var searchResult struct {
		Hits struct {
			Total struct {
				Value int64 `json:"value"`
			} `json:"total"`
			Hits []struct {
				Source models.Waybill `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	
	if err := json.NewDecoder(res.Body).Decode(&searchResult); err != nil {
		return nil, 0, fmt.Errorf("decode search result: %w", err)
	}
	
	waybills := make([]models.Waybill, len(searchResult.Hits.Hits))
	for i, hit := range searchResult.Hits.Hits {
		waybills[i] = hit.Source
	}
	
	return waybills, searchResult.Hits.Total.Value, nil
}