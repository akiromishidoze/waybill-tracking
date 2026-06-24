terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state stored in S3 with DynamoDB locking.
  # 1. Create the S3 bucket and DynamoDB table (see backend/aws-bootstrap)
  # 2. Copy aws/backend.tfbackend.example to backend.tfbackend and fill in values
  # 3. Run: terraform init -backend-config=backend.tfbackend -migrate
  backend "s3" {}
}

provider "aws" {
  region = var.region
}

resource "aws_ecs_cluster" "waybill" {
  name = "waybill-cluster"
}

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "waybill-postgres"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "16.3"
  database_name           = "waybill"
  master_username         = "app"
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "waybill-redis"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 2
  parameter_group_name = "default.redis7"
  port                 = 6379
}

resource "aws_msk_cluster" "kafka" {
  cluster_name           = "waybill-kafka"
  kafka_version          = "3.6.0"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = var.subnet_ids
    security_groups = [aws_security_group.kafka.id]
  }
}

resource "aws_security_group" "kafka" {
  name        = "waybill-kafka-sg"
  description = "Kafka broker security group"
}