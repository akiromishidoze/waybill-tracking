package models

import "time"

type ChatbotConversation struct {
	ID           string    `json:"id"`
	CustomerName *string   `json:"customerName,omitempty"`
	Query        string    `json:"query"`
	Intent       string    `json:"intent"`
	Response     string    `json:"response"`
	Resolved     bool      `json:"resolved"`
	Messages     int       `json:"messages"`
	UserID       *string   `json:"userId,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type ChatbotMessage struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Intent    string    `json:"intent,omitempty"`
}

type ChatbotDashboard struct {
	Summary             ChatbotSummary        `json:"summary"`
	RecentConversations []ChatbotConversation `json:"recentConversations"`
	SampleConversation  []ChatbotMessage      `json:"sampleConversation"`
	QuickReplies        []QuickReply          `json:"quickReplies"`
}

type ChatbotSummary struct {
	TotalConversations   int     `json:"totalConversations"`
	TotalMessages        int     `json:"totalMessages"`
	AvgSatisfaction      float64 `json:"avgSatisfaction"`
	ResolvedWithoutAgent int     `json:"resolvedWithoutAgent"`
	ActiveNow            int     `json:"activeNow"`
}

type QuickReply struct {
	Label    string `json:"label"`
	Response string `json:"response"`
}

type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

type ChatResponse struct {
	Reply  string `json:"reply"`
	Intent string `json:"intent"`
}
