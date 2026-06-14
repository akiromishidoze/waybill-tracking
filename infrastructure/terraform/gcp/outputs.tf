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
