# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Waybill Tracking platform on AWS and GCP.

## Layout

```
infrastructure/terraform/
├── .gitignore                  # Excludes *.tfstate, backend.tfbackend, terraform.tfvars
├── aws/                        # AWS resources (ECS, RDS Aurora, ElastiCache, MSK, ALB)
│   ├── main.tf                 # Data stores and cluster
│   ├── app.tf                  # ECS task definitions, services, IAM, ALB
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tfbackend.example
│   └── terraform.tfvars.example
├── gcp/                        # GCP resources (GKE, Cloud SQL, Memorystore, Kubernetes workloads)
│   ├── main.tf                 # GKE cluster, Cloud SQL, Redis
│   ├── app.tf                  # Kubernetes deployments and services
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tfbackend.example
│   └── terraform.tfvars.example
├── backend/
│   ├── aws-bootstrap/          # S3 bucket + DynamoDB table for remote state
│   └── gcs-bootstrap/          # GCS bucket for remote state
└── README.md
```

## What is deployed

### AWS (`aws/`)

- **ECS Fargate cluster** with services for:
  - `core-api` (2 replicas, exposed via `/api/*` ALB listener rule)
  - `dashboard` (2 replicas, default ALB listener target)
  - `analytics-api` (1 replica)
  - `celery-worker` (1 replica)
  - `celery-beat` (1 replica)
- **Application Load Balancer** with HTTP listener and health checks on `/health` (core-api) and `/` (dashboard).
- **IAM roles** for ECS task execution and task runtime.
- **Security groups** for the ALB, core-api, and dashboard.
- **CloudWatch Log Groups** for each ECS service.
- **Data stores**: Aurora PostgreSQL, ElastiCache Redis, MSK Kafka.

### GCP (`gcp/`)

- **GKE cluster** with a default node pool.
- **Cloud SQL PostgreSQL** instance and `waybill` database.
- **Memorystore Redis** instance.
- **Kubernetes workloads** in the `waybill` namespace:
  - `core-api` deployment + ClusterIP service
  - `dashboard` deployment + LoadBalancer service
  - `analytics-api` deployment
  - `celery-worker` deployment
  - `celery-beat` deployment
- **ConfigMap** and **Secret** for shared environment variables and credentials.

## Remote State

Both AWS and GCP modules use **partial backend configuration** (`backend "s3" {}` / `backend "gcs" {}`). Backend values are never hardcoded — they are supplied via `backend.tfbackend` or CI/CD environment variables.

### AWS (S3 + DynamoDB locking)

**Step 1 — Bootstrap the state bucket (one-time, per environment):**

```bash
cd infrastructure/terraform/backend/aws-bootstrap
terraform init
terraform apply -var="bucket_name=waybill-tfstate-prod"
# Outputs: bucket_name, bucket_arn, dynamodb_table, dynamodb_table_arn
```

**Step 2 — Configure and initialise the AWS module:**

```bash
cd infrastructure/terraform/aws
cp backend.tfbackend.example backend.tfbackend
# Edit backend.tfbackend — set bucket, region, dynamodb_table
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set vpc_id, subnet_ids, public_subnet_ids, private_subnet_ids, db_password, jwt_secret, admin_password, ecr_repository_url
terraform init -backend-config=backend.tfbackend
terraform plan
```

### GCP (GCS)

**Step 1 — Bootstrap the state bucket (one-time, per environment):**

```bash
cd infrastructure/terraform/backend/gcs-bootstrap
terraform init
terraform apply \
  -var="project_id=my-gcp-project" \
  -var="bucket_name=waybill-tfstate-prod"
# Outputs: bucket_name, bucket_url
```

**Step 2 — Configure and initialise the GCP module:**

```bash
cd infrastructure/terraform/gcp
cp backend.tfbackend.example backend.tfbackend
# Edit backend.tfbackend — set bucket
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set project_id, db_password, jwt_secret, admin_password, artifact_registry_url
terraform init -backend-config=backend.tfbackend
terraform plan
```

## Migrating from Local State

If a `.terraform.tfstate` already exists locally, pass `-migrate-state` on first init:

```bash
terraform init -backend-config=backend.tfbackend -migrate-state
```

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/terraform.yml` runs automatically on every PR and push to `main` for paths under `infrastructure/terraform/`.

| Event | Behaviour |
|---|---|
| Pull Request | `terraform plan` output is posted as a PR comment |
| Push to `main` | `terraform apply` runs automatically |

**Required GitHub secrets:**

| Secret | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS credentials for Terraform |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for Terraform |
| `GCP_SA_KEY` | GCP service account JSON key |
| `DB_PASSWORD` | PostgreSQL master password |
| `JWT_SECRET` | JWT secret for the core-api container |
| `ADMIN_PASSWORD` | Admin user password for the seeded admin account |

**Required GitHub variables (non-secret):**

| Variable | Example |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `TF_STATE_BUCKET_AWS` | `waybill-tfstate-prod` |
| `TF_STATE_LOCK_TABLE` | `terraform-state-lock` |
| `AWS_VPC_ID` | `vpc-12345678` |
| `AWS_SUBNET_IDS` | `["subnet-aaa","subnet-bbb","subnet-ccc"]` |
| `AWS_PUBLIC_SUBNET_IDS` | `["subnet-pub-aaa","subnet-pub-bbb"]` |
| `AWS_PRIVATE_SUBNET_IDS` | `["subnet-priv-aaa","subnet-priv-bbb","subnet-priv-ccc"]` |
| `AWS_ECR_REPOSITORY_URL` | `123456789012.dkr.ecr.us-east-1.amazonaws.com` |
| `TF_STATE_BUCKET_GCP` | `waybill-tfstate-prod` |
| `GCP_PROJECT_ID` | `my-gcp-project` |
| `GCP_ARTIFACT_REGISTRY_URL` | `us-central1-docker.pkg.dev/my-gcp-project/waybill` |

## State Security Best Practices

- **Versioning** is enabled on both S3 and GCS state buckets (done in bootstrap modules).
- **Encryption at rest**: S3 uses `AES256`, GCS uses default Google-managed encryption.
- **Public access** is blocked on S3 (`aws_s3_bucket_public_access_block`) and enforced on GCS (`public_access_prevention = "enforced"`).
- **Uniform bucket-level access** is enabled on GCS to prevent per-object ACL bypasses.
- **Noncurrent version expiry**: S3 expires old state versions after 90 days; GCS keeps only the 10 most recent versions.
- **State locking**: AWS uses DynamoDB; GCS has native object locking via the GCS backend.
- Use **separate state buckets per environment** (dev, staging, prod).
- **Never commit** `backend.tfbackend`, `terraform.tfvars`, or any `*.tfstate` file — these are excluded by `.gitignore`.
