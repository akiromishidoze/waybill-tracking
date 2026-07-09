package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type AttachmentRepository struct {
	db *pgxpool.Pool
}

func NewAttachmentRepository(db *pgxpool.Pool) *AttachmentRepository {
	return &AttachmentRepository{db: db}
}

func (r *AttachmentRepository) List(ctx context.Context, waybillID string) ([]models.Attachment, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at
		 FROM attachments WHERE waybill_id=$1 ORDER BY uploaded_at DESC`, waybillID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attachments []models.Attachment
	for rows.Next() {
		var a models.Attachment
		if err := rows.Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt); err != nil {
			return nil, err
		}
		attachments = append(attachments, a)
	}
	if attachments == nil {
		attachments = []models.Attachment{}
	}
	return attachments, nil
}

func (r *AttachmentRepository) Create(ctx context.Context, waybillID, fileName, fileType string, fileSize int64, data, uploadedBy string) (*models.Attachment, error) {
	var a models.Attachment
	err := r.db.QueryRow(ctx,
		`INSERT INTO attachments (waybill_id, file_name, file_type, file_size, data, uploaded_by)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at`,
		waybillID, fileName, fileType, fileSize, data, uploadedBy,
	).Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AttachmentRepository) GetByID(ctx context.Context, id string) (*models.Attachment, error) {
	var a models.Attachment
	err := r.db.QueryRow(ctx,
		`SELECT id, waybill_id, file_name, file_type, file_size, data, uploaded_by, uploaded_at
		 FROM attachments WHERE id=$1`, id,
	).Scan(&a.ID, &a.WaybillID, &a.FileName, &a.FileType, &a.FileSize, &a.Data, &a.UploadedBy, &a.UploadedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AttachmentRepository) Delete(ctx context.Context, id, uploadedBy string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM attachments WHERE id=$1 AND uploaded_by=$2`, id, uploadedBy)
	return err
}
