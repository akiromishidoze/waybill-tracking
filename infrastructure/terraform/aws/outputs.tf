output "ecs_cluster_id" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.waybill.arn
}

output "rds_cluster_endpoint" {
  description = "Aurora PostgreSQL writer endpoint"
  value       = aws_rds_cluster.postgres.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Aurora PostgreSQL reader endpoint"
  value       = aws_rds_cluster.postgres.reader_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "kafka_bootstrap_brokers" {
  description = "MSK bootstrap broker connection string"
  value       = aws_msk_cluster.kafka.bootstrap_brokers
}

output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.waybill.dns_name
}

output "api_url" {
  description = "Public URL for the core-api endpoints"
  value       = "http://${aws_lb.waybill.dns_name}/api"
}

output "dashboard_url" {
  description = "Public URL for the dashboard"
  value       = "http://${aws_lb.waybill.dns_name}"
}
