import logging
from datetime import datetime

import httpx

from app.integrations.carriers.base import CarrierAdapter, TrackingEvent

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "SHIPMENT_PICKED_UP": "PICKED_UP",
    "SHIPMENT_RECEIVED": "PICKED_UP",
    "IN_TRANSIT": "IN_TRANSIT",
    "OUT_FOR_DELIVERY": "OUT_FOR_DELIVERY",
    "DELIVERED": "DELIVERED",
    "UNDELIVERED": "DELIVERY_FAILED",
    "RETURNED": "RETURNED",
    "EXCEPTION": "EXCEPTION",
    "ON_HOLD": "ON_HOLD",
}


class LBCAdapter(CarrierAdapter):
    """
    Adapter for LBC Express Philippines.

    Expected endpoint: GET {api_endpoint}/track?trackingNumber=<number>
    Response: {
        "trackingDetails": [
            {"status": "...", "location": "...", "dateTime": "YYYY-MM-DDTHH:MM:SS", "remarks": "..."}
        ]
    }
    """

    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        endpoint = self.carrier.get("apiEndpoint", "")
        api_key = self.carrier.get("apiKey", "")

        if not endpoint:
            logger.warning("LBC Express carrier has no API endpoint configured")
            return []

        url = f"{endpoint.rstrip('/')}/track"
        headers = {}
        if api_key:
            headers["x-api-key"] = api_key

        try:
            response = httpx.get(
                url,
                params={"trackingNumber": tracking_number},
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("LBC request failed for %s: %s", tracking_number, e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("LBC returned error for %s: %s", tracking_number, e)
            return []
        except ValueError as e:
            logger.error("LBC invalid JSON for %s: %s", tracking_number, e)
            return []

        details = data.get("trackingDetails", []) if isinstance(data, dict) else []
        events: list[TrackingEvent] = []
        for item in details:
            if not isinstance(item, dict):
                continue
            raw_ts = item.get("dateTime", "")
            try:
                ts = datetime.fromisoformat(raw_ts) if raw_ts else datetime.utcnow()
            except ValueError:
                ts = datetime.utcnow()

            raw_status = item.get("status", "")
            status = _STATUS_MAP.get(raw_status.upper().replace(" ", "_"), "IN_TRANSIT")
            events.append(
                TrackingEvent(
                    status=status,
                    location=item.get("location", ""),
                    timestamp=ts,
                    remark=item.get("remarks"),
                    raw=item,
                )
            )
        return events

    def supports(self, carrier_name: str) -> bool:
        return "lbc" in carrier_name.lower()
