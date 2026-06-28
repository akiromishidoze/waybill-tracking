package models

import "time"

type ScheduledReport struct {
	ID          string     `json:"id"`
	UserID      string     `json:"userId"`
	Name        string     `json:"name"`
	ReportType  string     `json:"reportType"`
	Schedule    string     `json:"schedule"`
	Recipients  []string   `json:"recipients"`
	LastRunAt   *time.Time `json:"lastRunAt,omitempty"`
	NextRunAt   *time.Time `json:"nextRunAt,omitempty"`
	IsActive    bool       `json:"isActive"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type CreateScheduledReportRequest struct {
	Name       string   `json:"name" binding:"required"`
	ReportType string   `json:"reportType" binding:"required"`
	Schedule   string   `json:"schedule" binding:"required"`
	Recipients []string `json:"recipients" binding:"required,min=1"`
}

type UpdateScheduledReportRequest struct {
	Name       *string  `json:"name"`
	ReportType *string  `json:"reportType"`
	Schedule   *string  `json:"schedule"`
	Recipients *[]string `json:"recipients"`
	IsActive   *bool    `json:"isActive"`
}
