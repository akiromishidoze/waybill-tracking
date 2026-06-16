terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }

  # Remote state stored in a GCS bucket.
  # 1. Run: gsutil mb gs://<BUCKET_NAME>
  # 2. Uncomment the block below and replace <BUCKET_NAME> / <PREFIX>
  # 3. Run: terraform init -migrate
  #
  # backend "gcs" {
  #   bucket = "<BUCKET_NAME>"
  #   prefix = "terraform/gcp"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_container_cluster" "waybill" {
  name             = "waybill-cluster"
  location         = var.region
  network          = "default"
  subnetwork       = "default"

  initial_node_count = 3
  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 50
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  deletion_protection = false
}

resource "google_sql_database_instance" "postgres" {
  name             = "waybill-postgres"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-custom-2-7680"
    disk_size = 100
    disk_type = "PD_SSD"
    backup_configuration {
      enabled = true
      point_in_time_recovery_enabled = true
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "waybill_db" {
  name     = "waybill"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app_user" {
  name     = "app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

resource "google_redis_instance" "cache" {
  name           = "waybill-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 2
  region         = var.region
}
