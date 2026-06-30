import logging
from datetime import datetime

import httpx

from app.integrations.carriers.base import CarrierAdapter, TrackingEvent

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "PICKED_UP": "PICKED_UP",
    "ACCEPTED": "PICKED_UP",
    "IN_TRANSIT": "IN_TRANSIT",
    "SORTING": "IN_TRANSIT",
    "OUT_FOR_DELIVERY": "OUT_FOR_DELIVERY",
    "DELIVERED": "DELIVERED",
    "FAILED_DELIVERY": "DELIVERY_FAILED",
    "RETURN": "RETURNED",
    "EXCEPTION": "EXCEPTION",
    "CUSTOMS_HOLD": "ON_HOLD",
}


class TwoGoAdapter(CarrierAdapter):
    """
    Adapter for 2GO Express Philippines.

    Expected endpoint: GET {api_endpoint}/shipment/{tracking_number}
    Response: {
        "events": [
            {"eventCode": "...", "hub": "...", "eventDate": "YYYY-MM-DDTHH:MM:SSZ", "description": "..."}
        ]
    }
    """

    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        endpoint = self.carrier.get("apiEndpoint", "")
        api_key = self.carrier.get("apiKey", "")

        if not endpoint:
            logger.warning("2GO Express carrier has no API endpoint configured")
            return []

        url = f"{endpoint.rstrip('/')}/shipment/{tracking_number}"
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = httpx.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("2GO request failed for %s: %s", tracking_number, e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("2GO returned error for %s: %s", tracking_number, e)
            return []
        except ValueError as e:
            logger.error("2GO invalid JSON for %s: %s", tracking_number, e)
            return []

        raw_events = data.get("events", []) if isinstance(data, dict) else []
        events: list[TrackingEvent] = []
        for item in raw_events:
            if not isinstance(item, dict):
                continue
            raw_ts = item.get("eventDate", "")
            try:
                ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")) if raw_ts else datetime.utcnow()
            except ValueError:
                ts = datetime.utcnow()

            raw_code = item.get("eventCode", "").upper()
            status = _STATUS_MAP.get(raw_code, "IN_TRANSIT")
            events.append(
                TrackingEvent(
                    status=status,
                    location=item.get("hub", ""),
                    timestamp=ts,
                    remark=item.get("description"),
                    raw=item,
                )
            )
        return events

    def supports(self, carrier_name: str) -> bool:
        return "2go" in carrier_name.lower() or "two go" in carrier_name.lower()
