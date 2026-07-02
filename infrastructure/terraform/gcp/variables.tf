variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "artifact_registry_url" {
  description = "Base URL of the Artifact Registry repository (without trailing slash)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "jwt_secret" {
  description = "JWT secret for API authentication"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Admin user email"
  type        = string
  default     = "admin@waybilltrack.com"
}

variable "admin_password" {
  description = "Admin user password"
  type        = string
  sensitive   = true
}