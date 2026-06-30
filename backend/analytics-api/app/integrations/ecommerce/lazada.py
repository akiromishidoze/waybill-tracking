import hashlib
import hmac
import logging
import time
from datetime import datetime

import httpx

from app.integrations.ecommerce.base import ECommerceAdapter, ECommerceOrder

logger = logging.getLogger(__name__)

_LAZADA_API_BASE = "https://api.lazada.com.ph/rest"


def _sign(params: dict, api_secret: str, path: str) -> str:
    """Lazada HMAC-SHA256 request signing."""
    sorted_params = "".join(f"{k}{v}" for k, v in sorted(params.items()))
    message = path + sorted_params
    return hmac.new(api_secret.encode(), message.encode(), hashlib.sha256).hexdigest().upper()


class LazadaAdapter(ECommerceAdapter):
    """
    Adapter for Lazada Philippines seller API.

    Required platform fields:
        apiKey    → App key (client ID)
        apiSecret → App secret

    Endpoint: GET /orders/get
    Docs: https://open.lazada.com/apps/doc/api
    """

    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        api_key = self.platform.get("apiKey", "")
        api_secret = self.platform.get("apiSecret", "")

        if not api_key or not api_secret:
            logger.warning("Lazada platform missing apiKey or apiSecret")
            return []

        path = "/orders/get"
        timestamp = str(int(time.time() * 1000))
        params: dict = {
            "app_key": api_key,
            "timestamp": timestamp,
            "sign_method": "sha256",
            "status": "pending",
            "limit": "50",
        }
        if since:
            params["created_after"] = since.strftime("%Y-%m-%dT%H:%M:%S+08:00")

        params["sign"] = _sign(params, api_secret, path)

        try:
            response = httpx.get(
                f"{_LAZADA_API_BASE}{path}",
                params=params,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("Lazada request failed: %s", e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("Lazada returned error: %s", e)
            return []
        except ValueError as e:
            logger.error("Lazada invalid JSON: %s", e)
            return []

        if data.get("code") != "0":
            logger.error("Lazada API error: %s", data.get("message"))
            return []

        raw_orders = (data.get("data") or {}).get("orders", [])
        orders: list[ECommerceOrder] = []
        for order in raw_orders:
            address = order.get("address_billing") or {}
            raw_ts = order.get("created_at", "")
            try:
                created_at = datetime.fromisoformat(raw_ts.replace("+0800", "+08:00")) if raw_ts else datetime.utcnow()
            except ValueError:
                created_at = datetime.utcnow()

            orders.append(
                ECommerceOrder(
                    order_id=str(order.get("order_id", "")),
                    recipient_name=address.get("first_name", "") + " " + address.get("last_name", ""),
                    recipient_address=", ".join(filter(None, [
                        address.get("address1", ""),
                        address.get("city", ""),
                        address.get("country", ""),
                    ])),
                    recipient_phone=address.get("phone", ""),
                    recipient_email=address.get("email"),
                    origin=self.platform.get("store_name", "Lazada Store"),
                    destination=address.get("city", "") or address.get("country", ""),
                    weight=float(order.get("weight", 0) or 0),
                    dimensions=None,
                    service_type="STANDARD",
                    items=order.get("order_items"),
                    created_at=created_at,
                )
            )
        return orders

    def supports(self, platform_name: str) -> bool:
        return "lazada" in platform_name.lower()
