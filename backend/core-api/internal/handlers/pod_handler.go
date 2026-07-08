package handlers

import (
	"context"
	"errors"
	"html/template"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/waybill-tracking/core-api/internal/apierror"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type PODHandler struct {
	waybillRepo *repository.WaybillRepository
	db          *pgxpool.Pool
}

func NewPODHandler(waybillRepo *repository.WaybillRepository, db *pgxpool.Pool) *PODHandler {
	return &PODHandler{waybillRepo: waybillRepo, db: db}
}

type podDeliveryScan struct {
	DriverName string
	Location   string
	Timestamp  time.Time
	PhotoURL   string
	Signature  string
	Remark     string
}

type podTemplateData struct {
	Waybill      *models.Waybill
	DeliveryScan *podDeliveryScan
	GeneratedAt  time.Time
}

func (h *PODHandler) GeneratePOD(c *gin.Context) {
	if h.waybillRepo == nil || h.db == nil {
		apierror.InternalJSON(c, errors.New("repository unavailable"))
		return
	}

	id := c.Param("id")
	ctx := context.Background()

	wb, err := h.waybillRepo.GetByID(ctx, id)
	if err != nil {
		apierror.NotFoundJSON(c, "waybill not found")
		return
	}

	var scan podDeliveryScan
	var photoURL, signature, remark *string
	err = h.db.QueryRow(ctx, `
		SELECT driver_name, location, "timestamp", photo_url, signature, remark
		FROM driver_scan_events
		WHERE waybill_id = $1 AND scan_type = 'DELIVERED'
		ORDER BY "timestamp" DESC
		LIMIT 1`, id).Scan(
		&scan.DriverName, &scan.Location, &scan.Timestamp,
		&photoURL, &signature, &remark,
	)
	if err == nil {
		if photoURL != nil {
			scan.PhotoURL = *photoURL
		}
		if signature != nil {
			scan.Signature = *signature
		}
		if remark != nil {
			scan.Remark = *remark
		}
	}

	data := podTemplateData{
		Waybill:     wb,
		GeneratedAt: time.Now(),
	}
	if scan.DriverName != "" || scan.Location != "" {
		data.DeliveryScan = &scan
	}

	tmpl, err := template.New("pod").Funcs(template.FuncMap{
		"fmtTime": func(t time.Time) string {
			return t.Format("02 Jan 2006, 03:04 PM")
		},
		"isImg": func(s string) bool {
			low := strings.ToLower(s)
			return strings.HasPrefix(low, "data:image") ||
				strings.HasSuffix(low, ".png") ||
				strings.HasSuffix(low, ".jpg") ||
				strings.HasSuffix(low, ".jpeg") ||
				strings.HasSuffix(low, ".gif") ||
				strings.HasSuffix(low, ".webp")
		},
	}).Parse(podHTMLTemplate)
	if err != nil {
		apierror.InternalJSON(c, errors.New("template error"))
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Content-Disposition", `inline; filename="POD-`+wb.TrackingNumber+`.html"`)
	_ = tmpl.Execute(c.Writer, data)
}

const podHTMLTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proof of Delivery — {{.Waybill.TrackingNumber}}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #2563eb; margin-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
  .brand span { color: #1e293b; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 18px; font-weight: 700; color: #1e293b; }
  .doc-title p { font-size: 11px; color: #64748b; margin-top: 2px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .status-delivered { background: #dcfce7; color: #16a34a; }
  .status-other { background: #fef9c3; color: #92400e; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
  .row { display: flex; margin-bottom: 6px; }
  .row-label { width: 140px; color: #64748b; font-size: 12px; flex-shrink: 0; }
  .row-value { font-weight: 600; font-size: 12px; word-break: break-word; }
  .tracking-num { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: 1px; margin-bottom: 4px; }
  .events-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .events-table th { background: #f1f5f9; padding: 6px 10px; text-align: left; font-weight: 600; color: #475569; font-size: 11px; }
  .events-table td { padding: 6px 10px; border-top: 1px solid #e2e8f0; vertical-align: top; }
  .events-table tr:last-child td { border-bottom: 1px solid #e2e8f0; }
  .sig-box { border: 2px solid #e2e8f0; border-radius: 8px; padding: 12px; min-height: 80px; display: flex; align-items: center; justify-content: center; }
  .sig-box img { max-height: 80px; max-width: 100%; object-fit: contain; }
  .sig-text { color: #94a3b8; font-size: 12px; font-style: italic; }
  .photo-box img { max-width: 100%; max-height: 160px; border-radius: 6px; border: 1px solid #e2e8f0; object-fit: cover; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; }
  .pod-stamp { border: 3px solid #16a34a; border-radius: 8px; padding: 6px 16px; color: #16a34a; font-weight: 800; font-size: 15px; letter-spacing: 1px; display: inline-block; transform: rotate(-4deg); }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff; }
  }
</style>
</head>
<body>

<div class="no-print" style="position:fixed;top:12px;right:16px;z-index:100;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:8px 18px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">🖨 Print / Save PDF</button>
  <button onclick="window.close()" style="padding:8px 14px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;cursor:pointer;">Close</button>
</div>

<div class="header">
  <div>
    <div class="brand">Waybill<span>Track</span></div>
    <div style="margin-top:6px;">
      {{if eq (print .Waybill.Status) "DELIVERED"}}
        <span class="status-badge status-delivered">✓ Delivered</span>
      {{else}}
        <span class="status-badge status-other">{{.Waybill.Status}}</span>
      {{end}}
    </div>
  </div>
  <div class="doc-title">
    <h1>Proof of Delivery</h1>
    <p>Generated: {{fmtTime .GeneratedAt}}</p>
    {{if .Waybill.ActualDelivery}}
    <p style="margin-top:4px;font-weight:600;color:#16a34a;">Delivered: {{fmtTime .Waybill.ActualDelivery}}</p>
    {{end}}
  </div>
</div>

<div class="section">
  <div class="tracking-num">{{.Waybill.TrackingNumber}}</div>
  <div style="font-size:12px;color:#64748b;">Tracking Number</div>
</div>

<div class="grid2">
  <div class="section">
    <div class="section-title">Shipment Details</div>
    <div class="card">
      <div class="row"><span class="row-label">Shipper</span><span class="row-value">{{.Waybill.ShipperName}}</span></div>
      <div class="row"><span class="row-label">Service Type</span><span class="row-value">{{.Waybill.ServiceType}}</span></div>
      <div class="row"><span class="row-label">Origin</span><span class="row-value">{{.Waybill.Origin}}</span></div>
      <div class="row"><span class="row-label">Destination</span><span class="row-value">{{.Waybill.Destination}}</span></div>
      <div class="row"><span class="row-label">Weight</span><span class="row-value">{{.Waybill.Weight}} kg</span></div>
      {{if .Waybill.Dimensions}}<div class="row"><span class="row-label">Dimensions</span><span class="row-value">{{.Waybill.Dimensions}}</span></div>{{end}}
      {{if .Waybill.CarrierName}}<div class="row"><span class="row-label">Carrier</span><span class="row-value">{{.Waybill.CarrierName}}</span></div>{{end}}
      <div class="row"><span class="row-label">Created</span><span class="row-value">{{fmtTime .Waybill.CreatedAt}}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Recipient</div>
    <div class="card">
      <div class="row"><span class="row-label">Name</span><span class="row-value">{{.Waybill.RecipientName}}</span></div>
      <div class="row"><span class="row-label">Phone</span><span class="row-value">{{.Waybill.RecipientPhone}}</span></div>
      <div class="row"><span class="row-label">Address</span><span class="row-value">{{.Waybill.RecipientAddress}}</span></div>
      {{if .Waybill.IsCOD}}<div class="row"><span class="row-label">COD Amount</span><span class="row-value" style="color:#d97706;font-weight:700;">₱ {{printf "%.2f" .Waybill.CODAmount}}</span></div>{{end}}
    </div>
  </div>
</div>

{{if .DeliveryScan}}
<div class="section">
  <div class="section-title">Delivery Confirmation</div>
  <div class="grid2">
    <div class="card">
      <div class="row"><span class="row-label">Delivered By</span><span class="row-value">{{.DeliveryScan.DriverName}}</span></div>
      <div class="row"><span class="row-label">Location</span><span class="row-value">{{.DeliveryScan.Location}}</span></div>
      <div class="row"><span class="row-label">Timestamp</span><span class="row-value">{{fmtTime .DeliveryScan.Timestamp}}</span></div>
      {{if .DeliveryScan.Remark}}<div class="row"><span class="row-label">Remark</span><span class="row-value">{{.DeliveryScan.Remark}}</span></div>{{end}}
    </div>
    <div>
      {{if .DeliveryScan.Signature}}
      <div class="section-title" style="margin-bottom:6px;">Recipient Signature</div>
      <div class="sig-box">
        {{if isImg .DeliveryScan.Signature}}
          <img src="{{.DeliveryScan.Signature}}" alt="Signature" />
        {{else}}
          <span class="sig-text">{{.DeliveryScan.Signature}}</span>
        {{end}}
      </div>
      {{else}}
      <div class="section-title" style="margin-bottom:6px;">Recipient Signature</div>
      <div class="sig-box"><span class="sig-text">No signature captured</span></div>
      {{end}}

      {{if .DeliveryScan.PhotoURL}}
      <div class="section-title" style="margin-top:10px;margin-bottom:6px;">Delivery Photo</div>
      <div class="photo-box"><img src="{{.DeliveryScan.PhotoURL}}" alt="Delivery photo" /></div>
      {{end}}
    </div>
  </div>
</div>
{{end}}

{{if .Waybill.Events}}
<div class="section">
  <div class="section-title">Shipment History</div>
  <table class="events-table">
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Status</th>
        <th>Location</th>
        <th>Remark</th>
      </tr>
    </thead>
    <tbody>
      {{range .Waybill.Events}}
      <tr>
        <td style="white-space:nowrap;">{{fmtTime .Timestamp}}</td>
        <td><strong>{{.Status}}</strong></td>
        <td>{{.Location}}</td>
        <td>{{if .Remark}}{{.Remark}}{{else}}—{{end}}</td>
      </tr>
      {{end}}
    </tbody>
  </table>
</div>
{{end}}

<div class="footer">
  <span>This is a system-generated Proof of Delivery document. WaybillTrack</span>
  {{if eq (print .Waybill.Status) "DELIVERED"}}
  <div class="pod-stamp">DELIVERED</div>
  {{end}}
</div>

</body>
</html>`
