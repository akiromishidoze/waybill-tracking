# Bootstrap the GCS bucket used for remote state storage.
# Run once before uncommenting the backend block in ../gcp/main.tf.
#
#   terraform init && terraform apply

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "bucket_name" {
  description = "GCS bucket name for Terraform state"
  type        = string
}

variable "region" {
  description = "GCS bucket region"
  type        = string
  default     = "us-central1"
}

resource "google_storage_bucket" "state" {
  name                        = var.bucket_name
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  force_destroy               = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  public_access_prevention = "enforced"

  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}

output "bucket_name" {
  value = google_storage_bucket.state.name
}

output "bucket_url" {
  description = "GCS bucket URL — use as backend bucket in backend.tfbackend"
  value       = google_storage_bucket.state.url
}