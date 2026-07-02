output "cluster_endpoint" {
  value = google_container_cluster.waybill.endpoint
}

output "cluster_ca_certificate" {
  value = google_container_cluster.waybill.master_auth[0].cluster_ca_certificate
}

output "database_ip" {
  value = google_sql_database_instance.postgres.public_ip_address
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "dashboard_url" {
  description = "Load balancer URL for the dashboard service (may take a few minutes to provision)"
  value       = kubernetes_service.dashboard.status[0].load_balancer[0].ingress[0].ip
}

output "api_url" {
  description = "Load balancer URL for the core-api service (may take a few minutes to provision)"
  value       = "http://${kubernetes_service.core_api.status[0].load_balancer[0].ingress[0].ip}:8080"
}