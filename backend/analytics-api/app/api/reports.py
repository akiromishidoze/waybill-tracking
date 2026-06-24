import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
import openpyxl

router = APIRouter(tags=["Reports"])

HEADERS = ["Tracking #", "Shipper", "Recipient", "Destination", "Status", "Created", "Updated"]


async def _fetch_waybill_rows(from_date: str, to_date: str, db: AsyncSession):
    result = await db.execute(text("""
        SELECT tracking_number, shipper_name, recipient_name, destination,
               status, created_at, updated_at
        FROM waybills
        WHERE created_at BETWEEN :from_date AND :to_date
        ORDER BY created_at DESC
    """), {"from_date": from_date, "to_date": to_date})
    return result.mappings().all()


def _row_values(r):
    return [
        r["tracking_number"], r["shipper_name"], r["recipient_name"],
        r["destination"], r["status"],
        str(r["created_at"]), str(r["updated_at"]),
    ]


@router.get(
    "/export",
    summary="Export waybill report as Excel",
    description="Generates an Excel (.xlsx) file containing waybill data filtered by date range. Returns the file as a downloadable stream.",
)
async def export_report(
    from_date: str = Query(default="2024-01-01", description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(default="2024-12-31", description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    rows = await _fetch_waybill_rows(from_date, to_date, db)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Waybill Report"

    ws.append(HEADERS)
    for r in rows:
        ws.append(_row_values(r))

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=waybill-report-{datetime.now().date()}.xlsx"},
    )


@router.get(
    "/export/csv",
    summary="Export waybill report as CSV",
    description="Generates a CSV file containing waybill data filtered by date range. Returns the file as a downloadable stream.",
)
async def export_csv(
    from_date: str = Query(default="2024-01-01", description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(default="2024-12-31", description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    rows = await _fetch_waybill_rows(from_date, to_date, db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(HEADERS)
    for r in rows:
        writer.writerow(_row_values(r))

    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=waybill-report-{datetime.now().date()}.csv"},
    )
