package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/models"
)

type CarrierRateRepository struct {
	db *pgxpool.Pool
}

func NewCarrierRateRepository(db *pgxpool.Pool) *CarrierRateRepository {
	return &CarrierRateRepository{db: db}
}

const rateColumns = `
	cr.id, cr.carrier_id, COALESCE(c.name,'') AS carrier_name,
	cr.service_type, cr.origin_zone, cr.destination_zone,
	cr.weight_min_kg, cr.weight_max_kg,
	cr.base_rate, cr.per_kg_rate, cr.currency,
	cr.transit_days_min, cr.transit_days_max,
	cr.is_active, cr.notes, cr.created_at, cr.updated_at`

func scanRate(row interface{ Scan(...any) error }) (*models.CarrierRate, error) {
	var r models.CarrierRate
	err := row.Scan(
		&r.ID, &r.CarrierID, &r.CarrierName,
		&r.ServiceType, &r.OriginZone, &r.DestinationZone,
		&r.WeightMinKg, &r.WeightMaxKg,
		&r.BaseRate, &r.PerKgRate, &r.Currency,
		&r.TransitDaysMin, &r.TransitDaysMax,
		&r.IsActive, &r.Notes, &r.CreatedAt, &r.UpdatedAt,
	)
	return &r, err
}

func (r *CarrierRateRepository) ListByCarrier(ctx context.Context, carrierID string) ([]models.CarrierRate, error) {
	rows, err := r.db.Query(ctx, `
		SELECT `+rateColumns+`
		FROM carrier_rates cr
		LEFT JOIN carriers c ON c.id = cr.carrier_id
		WHERE cr.carrier_id = $1
		ORDER BY cr.service_type, cr.weight_min_kg`, carrierID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rates []models.CarrierRate
	for rows.Next() {
		rate, err := scanRate(rows)
		if err != nil {
			return nil, err
		}
		rates = append(rates, *rate)
	}
	if rates == nil {
		rates = []models.CarrierRate{}
	}
	return rates, nil
}

func (r *CarrierRateRepository) GetByID(ctx context.Context, id string) (*models.CarrierRate, error) {
	row := r.db.QueryRow(ctx, `
		SELECT `+rateColumns+`
		FROM carrier_rates cr
		LEFT JOIN carriers c ON c.id = cr.carrier_id
		WHERE cr.id = $1`, id)
	return scanRate(row)
}

func (r *CarrierRateRepository) Create(ctx context.Context, carrierID string, req models.CreateCarrierRateRequest) (*models.CarrierRate, error) {
	id := uuid.New().String()
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	currency := req.Currency
	if currency == "" {
		currency = "PHP"
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO carrier_rates
			(id, carrier_id, service_type, origin_zone, destination_zone,
			 weight_min_kg, weight_max_kg, base_rate, per_kg_rate, currency,
			 transit_days_min, transit_days_max, is_active, notes, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
		id, carrierID, req.ServiceType, req.OriginZone, req.DestinationZone,
		req.WeightMinKg, req.WeightMaxKg, req.BaseRate, req.PerKgRate, currency,
		req.TransitDaysMin, req.TransitDaysMax, isActive, req.Notes, time.Now(),
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *CarrierRateRepository) Update(ctx context.Context, id string, req models.UpdateCarrierRateRequest) (*models.CarrierRate, error) {
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	serviceType := existing.ServiceType
	originZone := existing.OriginZone
	destinationZone := existing.DestinationZone
	weightMin := existing.WeightMinKg
	weightMax := existing.WeightMaxKg
	baseRate := existing.BaseRate
	perKgRate := existing.PerKgRate
	currency := existing.Currency
	transitMin := existing.TransitDaysMin
	transitMax := existing.TransitDaysMax
	isActive := existing.IsActive
	notes := existing.Notes

	if req.ServiceType != "" {
		serviceType = req.ServiceType
	}
	if req.OriginZone != "" {
		originZone = req.OriginZone
	}
	if req.DestinationZone != "" {
		destinationZone = req.DestinationZone
	}
	if req.WeightMinKg != nil {
		weightMin = *req.WeightMinKg
	}
	if req.WeightMaxKg != nil {
		weightMax = *req.WeightMaxKg
	}
	if req.BaseRate != nil {
		baseRate = *req.BaseRate
	}
	if req.PerKgRate != nil {
		perKgRate = *req.PerKgRate
	}
	if req.Currency != "" {
		currency = req.Currency
	}
	if req.TransitDaysMin != nil {
		transitMin = *req.TransitDaysMin
	}
	if req.TransitDaysMax != nil {
		transitMax = *req.TransitDaysMax
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if req.Notes != "" {
		notes = req.Notes
	}

	_, err = r.db.Exec(ctx, `
		UPDATE carrier_rates SET
			service_type=$1, origin_zone=$2, destination_zone=$3,
			weight_min_kg=$4, weight_max_kg=$5, base_rate=$6, per_kg_rate=$7,
			currency=$8, transit_days_min=$9, transit_days_max=$10,
			is_active=$11, notes=$12, updated_at=$13
		WHERE id=$14`,
		serviceType, originZone, destinationZone,
		weightMin, weightMax, baseRate, perKgRate,
		currency, transitMin, transitMax,
		isActive, notes, time.Now(), id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *CarrierRateRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM carrier_rates WHERE id = $1`, id)
	return err
}

func (r *CarrierRateRepository) Compare(ctx context.Context, serviceType, origin, destination string, weightKg float64) ([]models.RateQuote, error) {
	rows, err := r.db.Query(ctx, `
		SELECT cr.id, cr.carrier_id, c.name,
		       cr.service_type, cr.base_rate, cr.per_kg_rate, cr.currency,
		       cr.transit_days_min, cr.transit_days_max
		FROM carrier_rates cr
		JOIN carriers c ON c.id = cr.carrier_id
		WHERE cr.is_active = true
		  AND c.is_active = true
		  AND cr.service_type = $1
		  AND $4 BETWEEN cr.weight_min_kg AND cr.weight_max_kg
		  AND (cr.origin_zone = '' OR cr.origin_zone ILIKE $2)
		  AND (cr.destination_zone = '' OR cr.destination_zone ILIKE $3)
		ORDER BY (cr.base_rate + cr.per_kg_rate * $4) ASC`,
		serviceType, "%"+origin+"%", "%"+destination+"%", weightKg,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var quotes []models.RateQuote
	for rows.Next() {
		var q models.RateQuote
		var baseRate, perKgRate float64
		if err := rows.Scan(
			&q.RateID, &q.CarrierID, &q.CarrierName,
			&q.ServiceType, &baseRate, &perKgRate, &q.Currency,
			&q.TransitDaysMin, &q.TransitDaysMax,
		); err != nil {
			return nil, err
		}
		q.BaseRate = baseRate
		q.WeightCharge = perKgRate * weightKg
		q.TotalRate = baseRate + q.WeightCharge
		quotes = append(quotes, q)
	}
	if quotes == nil {
		quotes = []models.RateQuote{}
	}
	return quotes, nil
}
