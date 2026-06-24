# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Waybill Tracking platform on AWS and GCP.

## Layout

```
infrastructure/terraform/
├── aws/                  # AWS resources (ECS, RDS, ElastiCache, MSK)
├── gcp/                  # GCP resources (GKE, Cloud SQL, Memorystore)
├── backend/
│   ├── aws-bootstrap/    # S3 + DynamoDB bootstrap for remote state
│   └── gcs-bootstrap/    # GCS bucket bootstrap for remote state
└── README.md
```

## Remote State

Both the AWS and GCP modules are configured to use **remote Terraform state** with partial backend configuration. By default, `terraform init` will ask for backend settings unless you provide a `backend.tfbackend` file.

### AWS (S3 + DynamoDB locking)

1. Bootstrap the state bucket and lock table:

   ```bash
   cd infrastructure/terraform/backend/aws-bootstrap
   terraform init
   terraform apply -var="bucket_name=waybill-tfstate-<ENV>"
   ```

2. Configure the AWS module to use the remote state:

   ```bash
   cd infrastructure/terraform/aws
   cp backend.tfbackend.example backend.tfbackend
   # Edit backend.tfbackend and replace <ENV> with the real bucket name
   terraform init -backend-config=backend.tfbackend
   ```

### GCP (GCS)

1. Bootstrap the state bucket:

   ```bash
   cd infrastructure/terraform/backend/gcs-bootstrap
   terraform init
   terraform apply -var="project_id=<PROJECT_ID>" -var="bucket_name=waybill-tfstate-<ENV>"
   ```

2. Configure the GCP module to use the remote state:

   ```bash
   cd infrastructure/terraform/gcp
   cp backend.tfbackend.example backend.tfbackend
   # Edit backend.tfbackend and replace <ENV> with the real bucket name
   terraform init -backend-config=backend.tfbackend
   ```

## Migrating from Local State

If you already have a local `.terraform.tfstate` file, add the `-migrate-state` flag when running `terraform init`:

```bash
terraform init -backend-config=backend.tfbackend -migrate-state
```

## State Security Best Practices

- Enable **versioning** on the state bucket (done in the bootstrap modules).
- Enable **encryption** for state at rest (S3 uses `AES256`, GCS uses default encryption).
- Restrict bucket access to the CI/CD role and authorized operators only.
- Use separate state buckets for each environment (dev, staging, prod).
- Never commit `backend.tfbackend` or `.terraform.tfstate` files.
