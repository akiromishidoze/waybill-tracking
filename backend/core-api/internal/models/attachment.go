package models

import "time"

type Attachment struct {
	ID         string    `json:"id"`
	WaybillID  string    `json:"waybillId"`
	FileName   string    `json:"fileName"`
	FileType   string    `json:"fileType"`
	FileSize   int64     `json:"fileSize"`
	Data       string    `json:"data"`
	UploadedBy string    `json:"uploadedBy"`
	UploadedAt time.Time `json:"uploadedAt"`
}
