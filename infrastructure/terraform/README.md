# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Waybill Tracking platform on AWS and GCP.

## Layout

```
infrastructure/terraform/
├── .gitignore                  # Excludes *.tfstate, backend.tfbackend, terraform.tfvars
├── aws/                        # AWS resources (ECS, RDS Aurora, ElastiCache, MSK)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tfbackend.example
│   └── terraform.tfvars.example
├── gcp/                        # GCP resources (GKE, Cloud SQL, Memorystore)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tfbackend.example
│   └── terraform.tfvars.example
├── backend/
│   ├── aws-bootstrap/          # S3 bucket + DynamoDB table for remote state
│   └── gcs-bootstrap/          # GCS bucket for remote state
└── README.md
```

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
# Edit terraform.tfvars — set db_password, subnet_ids
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
# Edit terraform.tfvars — set project_id, db_password
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

**Required GitHub variables (non-secret):**

| Variable | Example |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `TF_STATE_BUCKET_AWS` | `waybill-tfstate-prod` |
| `TF_STATE_LOCK_TABLE` | `terraform-state-lock` |
| `AWS_SUBNET_IDS` | `["subnet-aaa","subnet-bbb","subnet-ccc"]` |
| `TF_STATE_BUCKET_GCP` | `waybill-tfstate-prod` |
| `GCP_PROJECT_ID` | `my-gcp-project` |

## State Security Best Practices

- **Versioning** is enabled on both S3 and GCS state buckets (done in bootstrap modules).
- **Encryption at rest**: S3 uses `AES256`, GCS uses default Google-managed encryption.
- **Public access** is blocked on S3 (`aws_s3_bucket_public_access_block`) and enforced on GCS (`public_access_prevention = "enforced"`).
- **Uniform bucket-level access** is enabled on GCS to prevent per-object ACL bypasses.
- **Noncurrent version expiry**: S3 expires old state versions after 90 days; GCS keeps only the 10 most recent versions.
- **State locking**: AWS uses DynamoDB; GCS has native object locking via the GCS backend.
- Use **separate state buckets per environment** (dev, staging, prod).
- **Never commit** `backend.tfbackend`, `terraform.tfvars`, or any `*.tfstate` file — these are excluded by `.gitignore`.
