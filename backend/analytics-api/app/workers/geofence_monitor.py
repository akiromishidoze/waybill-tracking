import asyncio
import json
import logging
import math
from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.config import settings
from app.core.database import async_session
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula."""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def point_in_polygon(lat, lon, polygon_coords):
    """Check if a point is inside a polygon using ray casting algorithm."""
    if not polygon_coords:
        return False
    
    try:
        coords = json.loads(polygon_coords) if isinstance(polygon_coords, str) else polygon_coords
        if not coords or len(coords) < 3:
            return False
        
        x, y = lon, lat
        n = len(coords)
        inside = False
        
        p1x, p1y = coords[0]
        for i in range(n + 1):
            p2x, p2y = coords[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    except (json.JSONDecodeError, TypeError, IndexError):
        return False

@celery_app.task
def monitor_geofence_zones():
    """Monitor GPS locations against active geofence zones and create events."""
    logger.info("Monitoring geofence zones")
    
    async def _run():
        async with async_session() as session:
            # Fetch active zones
            zones_result = await session.execute(text("""
                SELECT id, zone_id, name, zone_type, center_lat, center_lon, radius_meters, polygon_coords
                FROM geofence_zones
                WHERE is_active = true
            """))
            zones = zones_result.mappings().all()
            
            if not zones:
                logger.info("No active geofence zones found")
                return []
            
            logger.info(f"Found {len(zones)} active geofence zones")
            
            # Fetch recent GPS locations (last 5 minutes)
            gps_result = await session.execute(text("""
                SELECT id, waybill_id, tracking_number, latitude, longitude, recorded_at
                FROM gps_locations
                WHERE recorded_at > NOW() - INTERVAL '5 minutes'
                ORDER BY recorded_at DESC
            """))
            gps_locations = gps_result.mappings().all()
            
            if not gps_locations:
                logger.info("No recent GPS locations found")
                return []
            
            logger.info(f"Found {len(gps_locations)} recent GPS locations")
            
            events = []
            
            for zone in zones:
                zone_id = zone['zone_id']
                zone_name = zone['name']
                zone_type = zone['zone_type']
                
                for gps in gps_locations:
                    waybill_id = gps['waybill_id']
                    tracking_number = gps['tracking_number']
                    lat = gps['latitude']
                    lon = gps['longitude']
                    
                    # Check if this GPS point is inside the zone
                    is_inside = False
                    
                    if zone_type == 'RADIUS' and zone['center_lat'] and zone['center_lon'] and zone['radius_meters']:
                        distance = haversine_distance(lat, lon, zone['center_lat'], zone['center_lon'])
                        is_inside = distance <= zone['radius_meters']
                    
                    elif zone_type == 'POLYGON' and zone['polygon_coords']:
                        is_inside = point_in_polygon(lat, lon, zone['polygon_coords'])
                    
                    # Determine event type
                    event_type = 'ENTER' if is_inside else 'EXIT'
                    
                    # Check if we already created an event for this waybill/zone recently (avoid duplicates)
                    recent_check = await session.execute(text("""
                        SELECT id FROM geofence_events
                        WHERE waybill_id = :waybill_id
                          AND geofence_id = :zone_id
                          AND event_type = :event_type
                          AND recorded_at > NOW() - INTERVAL '10 minutes'
                        LIMIT 1
                    """), {
                        "waybill_id": waybill_id,
                        "zone_id": zone_id,
                        "event_type": event_type,
                    })
                    
                    if recent_check.fetchone():
                        continue
                    
                    # Create geofence event
                    event_result = await session.execute(text("""
                        INSERT INTO geofence_events (waybill_id, tracking_number, geofence_id, geofence_name, event_type, latitude, longitude, recorded_at)
                        VALUES (:waybill_id, :tracking_number, :zone_id, :zone_name, :event_type, :lat, :lon, NOW())
                        RETURNING id
                    """), {
                        "waybill_id": waybill_id,
                        "tracking_number": tracking_number,
                        "zone_id": zone_id,
                        "zone_name": zone_name,
                        "event_type": event_type,
                        "lat": lat,
                        "lon": lon,
                    })
                    event_id = event_result.scalar()
                    
                    events.append({
                        'id': event_id,
                        'waybill_id': waybill_id,
                        'tracking_number': tracking_number,
                        'zone_id': zone_id,
                        'zone_name': zone_name,
                        'event_type': event_type,
                        'latitude': lat,
                        'longitude': lon,
                    })
            
            await session.commit()
            return events
    
    try:
        events = asyncio.run(_run())
        
        if not events:
            logger.info("No geofence events detected")
            return
        
        logger.info(f"Detected {len(events)} geofence events")
        
        for event in events:
            logger.info(
                f"Geofence event: {event['tracking_number']} {event['event_type']} zone {event['zone_name']} "
                f"({event['zone_id']}) at ({event['latitude']}, {event['longitude']})"
            )
        
        logger.info("Geofence monitoring complete")
        
    except Exception as e:
        logger.error(f"Failed to monitor geofence zones: {e}")
