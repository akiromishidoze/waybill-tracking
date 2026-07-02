variable "region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "subnet_ids" {
  description = "Subnet IDs for MSK brokers"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for the ALB and ECS services"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS service tasks"
  type        = list(string)
}

variable "alb_ingress_cidr" {
  description = "Allowed CIDR blocks for ALB ingress"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ecr_repository_url" {
  description = "Base URL of the ECR repository (without trailing slash)"
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