# Scripts

This directory contains operational and utility scripts for the Waybill Tracking system.

## Database Backup & Restore

### Prerequisites

- `pg_dump` and `psql` (PostgreSQL client tools)
- Access to the PostgreSQL instance configured in `docker-compose.yml` (default: `postgres:5432`)

### Environment Variables

Both scripts use the following environment variables, with sensible defaults for local development:

| Variable   | Default   | Description          |
|------------|-----------|----------------------|
| `PGHOST`   | localhost | Database host        |
| `PGPORT`   | 5432      | Database port        |
| `PGUSER`   | postgres    | Database user        |
| `PGPASSWORD` | postgres  | Database password    |
| `PGDATABASE` | waybill    | Database name        |

### Backup

Run a backup of the database:

```bash
./scripts/backup-db.sh [output_dir]
```

Backups are written as gzip-compressed SQL dumps to `./backups` by default, with a timestamp in the filename:

```
./backups/waybill-20240101-120000.sql.gz
```

To back up the Docker Compose database:

```bash
PGHOST=localhost PGPORT=5432 PGPASSWORD=postgres ./scripts/backup-db.sh
```

### Restore

Restore a previously created backup:

```bash
./scripts/restore-db.sh <backup_file>
```

Example:

```bash
./scripts/restore-db.sh ./backups/waybill-20240101-120000.sql.gz
```

The script will prompt for confirmation before overwriting the target database.

## Automated Backups

For production, schedule `backup-db.sh` via cron or a Kubernetes CronJob. For example, a daily cron job:

```cron
0 2 * * * /path/to/waybill-tracking/scripts/backup-db.sh /mnt/backups/waybill
```

## Other Scripts

- `generate-dev-certs.sh` — generates self-signed TLS certificates for local development.
- `mock-api.js` — standalone mock API server for frontend development.
- `seed.sql` — sample data for local database seeding.
