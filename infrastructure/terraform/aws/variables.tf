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
