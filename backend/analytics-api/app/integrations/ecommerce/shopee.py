import hashlib
import hmac
import logging
import time
from datetime import datetime

import httpx

from app.integrations.ecommerce.base import ECommerceAdapter, ECommerceOrder

logger = logging.getLogger(__name__)

_SHOPEE_API_BASE = "https://partner.shopeemobile.com"


def _sign(path: str, timestamp: int, api_key: str, api_secret: str, shop_id: int) -> str:
    """Shopee HMAC-SHA256 request signing."""
    base_string = f"{api_key}{path}{timestamp}{api_secret}{shop_id}"
    return hmac.new(api_secret.encode(), base_string.encode(), hashlib.sha256).hexdigest()


class ShopeeAdapter(ECommerceAdapter):
    """
    Adapter for Shopee Philippines seller API v2.

    Required platform fields:
        apiKey    → Partner ID (as string)
        apiSecret → Partner key
        storeUrl  → Shop ID (as string, stored in storeUrl for convenience)

    Endpoint: GET /api/v2/order/get_order_list
    Docs: https://open.shopee.com/documents
    """

    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        api_key = self.platform.get("apiKey", "")
        api_secret = self.platform.get("apiSecret", "")
        shop_id_str = self.platform.get("storeUrl", "") or self.platform.get("store_url", "")

        if not api_key or not api_secret or not shop_id_str:
            logger.warning("Shopee platform missing apiKey, apiSecret, or shop ID (storeUrl)")
            return []

        try:
            shop_id = int(shop_id_str)
        except (ValueError, TypeError):
            logger.error("Shopee shop ID must be numeric, got: %s", shop_id_str)
            return []

        path = "/api/v2/order/get_order_list"
        timestamp = int(time.time())
        sign = _sign(path, timestamp, api_key, api_secret, shop_id)

        time_from = int(since.timestamp()) if since else (timestamp - 86400)
        params = {
            "partner_id": api_key,
            "shop_id": shop_id,
            "timestamp": timestamp,
            "sign": sign,
            "time_range_field": "create_time",
            "time_from": time_from,
            "time_to": timestamp,
            "page_size": 50,
            "order_status": "READY_TO_SHIP",
        }

        try:
            response = httpx.get(
                f"{_SHOPEE_API_BASE}{path}",
                params=params,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("Shopee request failed: %s", e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("Shopee returned error: %s", e)
            return []
        except ValueError as e:
            logger.error("Shopee invalid JSON: %s", e)
            return []

        if data.get("error"):
            logger.error("Shopee API error: %s — %s", data.get("error"), data.get("message"))
            return []

        order_list = (data.get("response") or {}).get("order_list", [])
        if not order_list:
            return []

        order_sn_list = [o["order_sn"] for o in order_list if o.get("order_sn")]
        if not order_sn_list:
            return []

        detail_path = "/api/v2/order/get_order_detail"
        detail_timestamp = int(time.time())
        detail_sign = _sign(detail_path, detail_timestamp, api_key, api_secret, shop_id)

        try:
            detail_response = httpx.get(
                f"{_SHOPEE_API_BASE}{detail_path}",
                params={
                    "partner_id": api_key,
                    "shop_id": shop_id,
                    "timestamp": detail_timestamp,
                    "sign": detail_sign,
                    "order_sn_list": ",".join(order_sn_list),
                },
                timeout=15,
            )
            detail_response.raise_for_status()
            detail_data = detail_response.json()
        except Exception as e:
            logger.error("Shopee order detail fetch failed: %s", e)
            return []

        orders: list[ECommerceOrder] = []
        for order in (detail_data.get("response") or {}).get("order_list", []):
            address = order.get("recipient_address") or {}
            created_ts = order.get("create_time")
            created_at = datetime.utcfromtimestamp(created_ts) if created_ts else datetime.utcnow()

            orders.append(
                ECommerceOrder(
                    order_id=order.get("order_sn", ""),
                    recipient_name=address.get("name", ""),
                    recipient_address=address.get("full_address", "") or ", ".join(filter(None, [
                        address.get("district", ""),
                        address.get("city", ""),
                        address.get("state", ""),
                    ])),
                    recipient_phone=address.get("phone", ""),
                    recipient_email=None,
                    origin=self.platform.get("store_name", "Shopee Store"),
                    destination=address.get("city", "") or address.get("state", ""),
                    weight=float(order.get("package_list", [{}])[0].get("weight", 0) if order.get("package_list") else 0),
                    dimensions=None,
                    service_type="STANDARD",
                    items=order.get("item_list"),
                    created_at=created_at,
                )
            )
        return orders

    def supports(self, platform_name: str) -> bool:
        return "shopee" in platform_name.lower()
