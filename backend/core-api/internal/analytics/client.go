package analytics

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/waybill-tracking/core-api/internal/logger"
	"go.uber.org/zap"

	"github.com/waybill-tracking/core-api/config"
)

type Client struct {
	analyticsURL string
	apiKey       string
	client       *http.Client
}

func NewClient(cfg *config.Config) *Client {
	return &Client{
		analyticsURL: cfg.AnalyticsAPIURL,
		apiKey:       cfg.InternalAPIKey,
		client:       &http.Client{Timeout: 5 * time.Second},
	}
}

type ETAResponse struct {
	WaybillID         string  `json:"waybillId"`
	TrackingNumber    string  `json:"trackingNumber"`
	PredictedDelivery string  `json:"predictedDelivery"`
	Confidence        float64 `json:"confidence"`
	EstimatedHours    float64 `json:"estimatedHours"`
	BasedOn           string  `json:"basedOn"`
}

func (c *Client) PredictETA(ctx context.Context, waybillID, authHeader string) (*ETAResponse, error) {
	if c.analyticsURL == "" {
		return nil, fmt.Errorf("analytics API URL not configured")
	}

	url := strings.TrimRight(c.analyticsURL, "/") + "/api/v1/analytics/predict-eta/" + waybillID
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", authHeader)
	if c.apiKey != "" {
		req.Header.Set("X-Internal-API-Key", c.apiKey)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("analytics API returned %d: %s", resp.StatusCode, string(body))
	}

	var result ETAResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) TrainModels(ctx context.Context, authHeader string) error {
	if c.analyticsURL == "" {
		return fmt.Errorf("analytics API URL not configured")
	}

	url := strings.TrimRight(c.analyticsURL, "/") + "/api/v1/analytics/train"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", authHeader)
	if c.apiKey != "" {
		req.Header.Set("X-Internal-API-Key", c.apiKey)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return fmt.Errorf("analytics API returned %d: %s", resp.StatusCode, string(body))
	}

	logger.L().Info("ML training triggered", zap.ByteString("response", body))
	return nil
}
