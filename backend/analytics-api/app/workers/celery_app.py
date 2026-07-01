from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "waybill_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "generate-daily-report": {
            "task": "app.workers.tasks.generate_daily_report",
            "schedule": crontab(hour=6, minute=0),
        },
        "scan-for-anomalies": {
            "task": "app.workers.tasks.scan_for_anomalies",
            "schedule": crontab(minute="*/30"),
        },
        "sync-carrier-tracking": {
            "task": "app.workers.carrier_sync.sync_carrier_tracking",
            "schedule": crontab(minute="*/15"),
        },
        "sync-ecommerce-orders": {
            "task": "app.workers.ecommerce_sync.sync_ecommerce_orders",
            "schedule": crontab(minute="*/30"),
        },
        "evaluate-auto-communication-rules": {
            "task": "app.workers.auto_comm.evaluate_auto_communication_rules",
            "schedule": crontab(minute="*/5"),
        },
        "check-iot-sensor-thresholds": {
            "task": "app.workers.iot_thresholds.check_iot_sensor_thresholds",
            "schedule": crontab(minute="*/2"),
        },
    },
)

from app.workers import carrier_sync, ecommerce_sync, tasks, auto_comm, iot_thresholds  # noqa: E402,F401