package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type CustomsRepository struct {
	db *pgxpool.Pool
}

func NewCustomsRepository(db *pgxpool.Pool) *CustomsRepository {
	return &CustomsRepository{db: db}
}

func (r *CustomsRepository) ListShipments(ctx context.Context) ([]models.CustomsShipment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			cs.id, cs.waybill_id, w.tracking_number, w.shipper_name, w.recipient_name,
			w.origin, w.destination, cs.origin_country, cs.destination_country,
			cs.customs_status, cs.estimated_clearance, cs.updated_at
		FROM customs_shipments cs
		JOIN waybills w ON w.id = cs.waybill_id
		ORDER BY cs.updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shipments []models.CustomsShipment
	for rows.Next() {
		var s models.CustomsShipment
		if err := rows.Scan(
			&s.ID, &s.WaybillID, &s.TrackingNumber, &s.ShipperName, &s.RecipientName,
			&s.Origin, &s.Destination, &s.OriginCountry, &s.DestinationCountry,
			&s.CustomsStatus, &s.EstimatedClearance, &s.LastUpdated,
		); err != nil {
			return nil, err
		}
		docs, err := r.listDocuments(ctx, s.WaybillID, s.TrackingNumber)
		if err != nil {
			return nil, err
		}
		s.Documents = docs
		shipments = append(shipments, s)
	}
	if shipments == nil {
		shipments = []models.CustomsShipment{}
	}
	return shipments, nil
}

func (r *CustomsRepository) listDocuments(ctx context.Context, waybillID, trackingNumber string) ([]models.CustomsDocument, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, waybill_id, doc_type, title, status, file_name, file_size, file_url,
		       notes, submitted_at, approved_at, created_at
		FROM customs_documents WHERE waybill_id = $1 ORDER BY created_at DESC`, waybillID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []models.CustomsDocument
	for rows.Next() {
		var d models.CustomsDocument
		if err := rows.Scan(
			&d.ID, &d.WaybillID, &d.DocType, &d.Title, &d.Status,
			&d.FileName, &d.FileSize, &d.FileURL, &d.Notes, &d.SubmittedAt, &d.ApprovedAt, &d.CreatedAt,
		); err != nil {
			return nil, err
		}
		d.TrackingNumber = trackingNumber
		docs = append(docs, d)
	}
	if docs == nil {
		docs = []models.CustomsDocument{}
	}
	return docs, nil
}

func (r *CustomsRepository) UpdateStatus(ctx context.Context, waybillID string, req models.UpdateCustomsStatusRequest) (*models.CustomsShipment, error) {
	var estClearance *time.Time
	if req.EstimatedClearance != nil && *req.EstimatedClearance != "" {
		t, err := time.Parse("2006-01-02", *req.EstimatedClearance)
		if err == nil {
			estClearance = &t
		}
	}

	originCountry := req.OriginCountry
	if originCountry == "" {
		originCountry = "PH"
	}
	destCountry := req.DestinationCountry
	if destCountry == "" {
		destCountry = "PH"
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO customs_shipments (waybill_id, customs_status, origin_country, destination_country, estimated_clearance, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (waybill_id) DO UPDATE SET
			customs_status = EXCLUDED.customs_status,
			origin_country = EXCLUDED.origin_country,
			destination_country = EXCLUDED.destination_country,
			estimated_clearance = EXCLUDED.estimated_clearance,
			updated_at = NOW()`,
		waybillID, req.CustomsStatus, originCountry, destCountry, estClearance,
	)
	if err != nil {
		return nil, err
	}

	shipments, err := r.ListShipments(ctx)
	if err != nil {
		return nil, err
	}
	for i := range shipments {
		if shipments[i].WaybillID == waybillID {
			return &shipments[i], nil
		}
	}
	return nil, nil
}

func (r *CustomsRepository) CreateDocument(ctx context.Context, waybillID, docType, title, fileName string, fileSize int, fileURL string) (*models.CustomsDocument, error) {
	var d models.CustomsDocument
	err := r.db.QueryRow(ctx, `
		INSERT INTO customs_documents (waybill_id, doc_type, title, status, file_name, file_size, file_url, submitted_at, created_at)
		VALUES ($1, $2, $3, 'SUBMITTED', $4, $5, $6, NOW(), NOW())
		RETURNING id, waybill_id, doc_type, title, status, file_name, file_size, file_url, notes, submitted_at, approved_at, created_at`,
		waybillID, docType, title, fileName, fileSize, fileURL,
	).Scan(
		&d.ID, &d.WaybillID, &d.DocType, &d.Title, &d.Status,
		&d.FileName, &d.FileSize, &d.FileURL, &d.Notes, &d.SubmittedAt, &d.ApprovedAt, &d.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *CustomsRepository) DeleteDocument(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM customs_documents WHERE id = $1", id)
	return err
}
