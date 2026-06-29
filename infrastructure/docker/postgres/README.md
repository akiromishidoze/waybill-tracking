# Database Backup and Restore

## Automated Backups

A `db-backup` service runs in Docker Compose and creates a compressed `pg_dump` of the `waybill` database every night at 02:00 UTC.

Backups are stored in the `postgres_backups` Docker volume at `/backups` and follow the naming convention:

```
waybill-YYYYMMDD_HHMMSS.sql.gz
```

Old backups are pruned automatically after `BACKUP_RETENTION_DAYS` (default: 7).

### Configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `BACKUP_SCHEDULE` | `0 2 * * *` | Cron expression for backup runs |
| `BACKUP_RETENTION_DAYS` | `7` | Number of days to keep backups |

Set these in your `.env` file or shell before running `docker compose up`.

## Restore a Backup

1. Stop the core-api and analytics-api services to avoid writes during restore:

   ```bash
   docker compose stop core-api analytics-api celery-worker
   ```

2. List available backups:

   ```bash
   docker run --rm -v waybill-tracking_postgres_backups:/backups alpine:latest ls -1 /backups
   ```

3. Run the restore script with the target backup. You must set `FORCE_RESTORE=true` to confirm the database will be dropped and recreated. Use the same TimescaleDB image used by the Postgres service so hypertable commands restore correctly:

   ```bash
   docker run --rm --network waybill-tracking_default \
     -e POSTGRES_DB=waybill \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_HOST=postgres \
     -e POSTGRES_PORT=5432 \
     -e FORCE_RESTORE=true \
     -v waybill-tracking_postgres_backups:/backups \
     -v ./infrastructure/docker/postgres/restore.sh:/usr/local/bin/restore.sh:ro \
     timescale/timescaledb:latest-pg16 \
     /usr/local/bin/restore.sh /backups/waybill-YYYYMMDD_HHMMSS.sql.gz
   ```

4. Restart the application services:

   ```bash
   docker compose start core-api analytics-api celery-worker
   ```

## On-Demand Backup

Run the backup script manually inside the backup container:

```bash
docker compose exec db-backup /usr/local/bin/backup.sh
```

Backups are written to `/backups` inside the `db-backup` container and persisted in the `postgres_backups` volume.

## Managed Database Alternative

For production, consider using a managed PostgreSQL service (e.g., AWS RDS, Google Cloud SQL, Azure Database) with automated backups and point-in-time recovery. Update `DATABASE_URL` in the application services to point to the managed instance.
