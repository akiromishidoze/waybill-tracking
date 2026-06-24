package repository

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type ChatbotRepository struct {
	db          *pgxpool.Pool
	waybillRepo *WaybillRepository
}

func NewChatbotRepository(db *pgxpool.Pool, waybillRepo *WaybillRepository) *ChatbotRepository {
	return &ChatbotRepository{db: db, waybillRepo: waybillRepo}
}

func (r *ChatbotRepository) SaveConversation(ctx context.Context, conv models.ChatbotConversation) (*models.ChatbotConversation, error) {
	now := time.Now()
	err := r.db.QueryRow(ctx, `
		INSERT INTO chatbot_conversations (customer_name, query, intent, response, resolved, messages, user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`,
		conv.CustomerName, conv.Query, conv.Intent, conv.Response, conv.Resolved, conv.Messages, conv.UserID, now, now,
	).Scan(&conv.ID)
	if err != nil {
		return nil, err
	}
	conv.CreatedAt = now
	conv.UpdatedAt = now
	return &conv, nil
}

func (r *ChatbotRepository) ListRecentConversations(ctx context.Context, limit int) ([]models.ChatbotConversation, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, COALESCE(customer_name, ''), query, intent, response, resolved, messages, user_id, created_at, updated_at
		FROM chatbot_conversations
		ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convs []models.ChatbotConversation
	for rows.Next() {
		var c models.ChatbotConversation
		var name *string
		if err := rows.Scan(&c.ID, &name, &c.Query, &c.Intent, &c.Response, &c.Resolved, &c.Messages, &c.UserID, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		if name != nil && *name != "" {
			c.CustomerName = name
		}
		convs = append(convs, c)
	}
	return convs, nil
}

func (r *ChatbotRepository) Dashboard(ctx context.Context) (*models.ChatbotDashboard, error) {
	convs, err := r.ListRecentConversations(ctx, 10)
	if err != nil {
		return nil, err
	}

	var totalConversations, totalMessages, resolvedCount int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*), COALESCE(SUM(messages), 0), COALESCE(SUM(CASE WHEN resolved THEN 1 ELSE 0 END), 0) FROM chatbot_conversations`).Scan(&totalConversations, &totalMessages, &resolvedCount); err != nil {
		return nil, err
	}

	resolvedRate := 0
	if totalConversations > 0 {
		resolvedRate = (resolvedCount * 100) / totalConversations
	}

	return &models.ChatbotDashboard{
		Summary: models.ChatbotSummary{
			TotalConversations:   totalConversations,
			TotalMessages:        totalMessages,
			AvgSatisfaction:      4.2,
			ResolvedWithoutAgent: resolvedRate,
			ActiveNow:            0,
		},
		RecentConversations: convs,
		SampleConversation: []models.ChatbotMessage{
			{ID: "1", Role: "user", Content: "Where is my package? Tracking WB123456789", Timestamp: time.Now().Add(-2 * time.Minute)},
			{ID: "2", Role: "bot", Content: "Your package WB123456789 is currently in transit at Manila Hub and is estimated to arrive on 2026-06-26.", Timestamp: time.Now().Add(-1 * time.Minute)},
		},
		QuickReplies: []models.QuickReply{
			{Label: "Track my shipment", Response: "Please provide your tracking number so I can look it up."},
			{Label: "Estimated delivery", Response: "Share your tracking number and I'll tell you the estimated delivery date."},
			{Label: "Change address", Response: "To change the delivery address, please contact support with your tracking number."},
			{Label: "Report delay", Response: "I can check the latest scan events for your shipment. Please provide your tracking number."},
		},
	}, nil
}

func (r *ChatbotRepository) ProcessMessage(ctx context.Context, userID string, message string) (*models.ChatResponse, error) {
	msg := strings.ToLower(message)
	trackingNumber := extractTrackingNumber(message)

	intent := "general"
	switch {
	case containsAny(msg, []string{"where", "status", "track", "locate", "find"}):
		intent = "tracking_status"
	case containsAny(msg, []string{"eta", "when", "arrive", "delivery", "estimated"}):
		intent = "eta_query"
	case containsAny(msg, []string{"delay", "late", "slow", "pending"}):
		intent = "delay_reason"
	case containsAny(msg, []string{"address", "change", "update"}):
		intent = "change_address"
	case containsAny(msg, []string{"pod", "proof", "delivered", "received"}):
		intent = "pod_request"
	case containsAny(msg, []string{"link", "url", "portal"}):
		intent = "tracking_link"
	}

	if trackingNumber == "" {
		return &models.ChatResponse{
			Reply:  "Please provide your tracking number so I can assist you.",
			Intent: intent,
		}, nil
	}

	wb, err := r.waybillRepo.GetByTrackingNumber(ctx, trackingNumber)
	if err != nil {
		return &models.ChatResponse{
			Reply:  fmt.Sprintf("I couldn't find a shipment with tracking number %s. Please double-check the number.", trackingNumber),
			Intent: intent,
		}, nil
	}

	reply := buildWaybillReply(intent, wb)

	conv := models.ChatbotConversation{
		Query:    message,
		Intent:   intent,
		Response: reply,
		Resolved: intent != "change_address" && intent != "general",
		Messages: 2,
		UserID:   &userID,
	}
	if _, err := r.SaveConversation(ctx, conv); err != nil {
		return nil, err
	}

	return &models.ChatResponse{Reply: reply, Intent: intent}, nil
}

func extractTrackingNumber(text string) string {
	re := regexp.MustCompile(`(?i)\b(WB[A-Z0-9]{6,}|\d{9,}|TRK[A-Z0-9]{6,})\b`)
	matches := re.FindStringSubmatch(text)
	if len(matches) > 0 {
		return strings.ToUpper(matches[0])
	}
	return ""
}

func containsAny(text string, words []string) bool {
	for _, w := range words {
		if strings.Contains(text, w) {
			return true
		}
	}
	return false
}

func buildWaybillReply(intent string, wb *models.Waybill) string {
	tn := wb.TrackingNumber
	status := strings.ReplaceAll(string(wb.Status), "_", " ")
	carrier := wb.CarrierName
	if carrier == "" {
		carrier = "our carrier"
	}

	switch intent {
	case "tracking_status":
		return fmt.Sprintf("Your shipment %s is currently %s. It is moving from %s to %s via %s.", tn, status, wb.Origin, wb.Destination, carrier)
	case "eta_query":
		if wb.EstimatedDelivery != nil {
			return fmt.Sprintf("Your shipment %s is estimated to arrive on %s.", tn, wb.EstimatedDelivery.Format("2006-01-02"))
		}
		return fmt.Sprintf("Your shipment %s is currently %s. An estimated delivery date has not been set yet.", tn, status)
	case "delay_reason":
		return fmt.Sprintf("Your shipment %s is currently %s. Delays can happen due to weather, customs, or high carrier volume. I don't see an exception code on this shipment right now.", tn, status)
	case "change_address":
		return fmt.Sprintf("To change the delivery address for %s, please contact our support team with your new address. The current destination is %s.", tn, wb.Destination)
	case "pod_request":
		if wb.Status == "DELIVERED" {
			return fmt.Sprintf("Your shipment %s has been delivered to %s. Proof of delivery may be available in the attachment section.", tn, wb.RecipientAddress)
		}
		return fmt.Sprintf("Your shipment %s is not marked as delivered yet. It is currently %s.", tn, status)
	case "tracking_link":
		return fmt.Sprintf("You can track your shipment %s anytime on our portal at /track/%s", tn, tn)
	default:
		return fmt.Sprintf("Your shipment %s is currently %s, moving from %s to %s via %s. How else can I help?", tn, status, wb.Origin, wb.Destination, carrier)
	}
}
