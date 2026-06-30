import logging
from datetime import datetime
from typing import Any

import httpx

from app.integrations.carriers.base import CarrierAdapter, TrackingEvent

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "Picked Up": "PICKED_UP",
    "In Transit": "IN_TRANSIT",
    "Out For Delivery": "OUT_FOR_DELIVERY",
    "Delivered": "DELIVERED",
    "Delivery Failed": "DELIVERY_FAILED",
    "Return to Sender": "RETURNED",
    "Exception": "EXCEPTION",
}


class JNTExpressAdapter(CarrierAdapter):
    """
    Adapter for J&T Express Philippines.

    Expected endpoint: POST {api_endpoint}/tracking
    Request body: {"billCode": "<tracking_number>"}
    Response: {
        "data": {
            "details": [
                {"scanType": "...", "scanAddress": "...", "scanDate": "YYYY-MM-DD HH:MM:SS", "remark": "..."}
            ]
        }
    }
    """

    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        endpoint = self.carrier.get("apiEndpoint", "")
        api_key = self.carrier.get("apiKey", "")

        if not endpoint:
            logger.warning("J&T Express carrier has no API endpoint configured")
            return []

        url = f"{endpoint.rstrip('/')}/tracking"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = httpx.post(
                url,
                json={"billCode": tracking_number},
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("J&T Express request failed for %s: %s", tracking_number, e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("J&T Express returned error for %s: %s", tracking_number, e)
            return []
        except ValueError as e:
            logger.error("J&T Express invalid JSON for %s: %s", tracking_number, e)
            return []

        details = (data.get("data") or {}).get("details", [])
        events: list[TrackingEvent] = []
        for item in details:
            if not isinstance(item, dict):
                continue
            raw_ts = item.get("scanDate", "")
            try:
                ts = datetime.strptime(raw_ts, "%Y-%m-%d %H:%M:%S") if raw_ts else datetime.utcnow()
            except ValueError:
                ts = datetime.utcnow()

            raw_status = item.get("scanType", "")
            status = _STATUS_MAP.get(raw_status, "IN_TRANSIT")
            events.append(
                TrackingEvent(
                    status=status,
                    location=item.get("scanAddress", ""),
                    timestamp=ts,
                    remark=item.get("remark"),
                    raw=item,
                )
            )
        return events

    def supports(self, carrier_name: str) -> bool:
        return "j&t" in carrier_name.lower() or "jnt" in carrier_name.lower() or "j and t" in carrier_name.lower()
