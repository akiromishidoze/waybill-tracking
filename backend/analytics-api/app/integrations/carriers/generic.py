import logging
from datetime import datetime
from typing import Any

import httpx

from app.integrations.carriers.base import CarrierAdapter, TrackingEvent

logger = logging.getLogger(__name__)


class GenericJsonCarrierAdapter(CarrierAdapter):
    """
    Generic HTTP adapter for carriers that expose a JSON tracking endpoint.

    Expected endpoint: GET {api_endpoint}/{tracking_number}
    Expected response: {"events": [{"status": "...", "location": "...", "timestamp": "ISO", "remark": "..."}]}
    """

    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        endpoint = self.carrier.get("apiEndpoint", "")
        api_key = self.carrier.get("apiKey", "")

        if not endpoint:
            logger.warning("Carrier %s has no API endpoint", self.carrier.get("name"))
            return []

        url = f"{endpoint.rstrip('/')}/{tracking_number}"
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = httpx.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("Carrier %s tracking request failed: %s", self.carrier.get("name"), e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("Carrier %s tracking returned error: %s", self.carrier.get("name"), e)
            return []
        except ValueError as e:
            logger.error("Carrier %s returned invalid JSON: %s", self.carrier.get("name"), e)
            return []

        events = data.get("events", []) if isinstance(data, dict) else []
        normalized = []
        for event in events:
            if not isinstance(event, dict):
                continue
            timestamp = event.get("timestamp")
            try:
                parsed_timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00")) if timestamp else datetime.utcnow()
            except (ValueError, AttributeError):
                parsed_timestamp = datetime.utcnow()

            normalized.append(
                TrackingEvent(
                    status=event.get("status", ""),
                    location=event.get("location", ""),
                    timestamp=parsed_timestamp,
                    remark=event.get("remark"),
                    raw=event,
                )
            )

        return normalized
