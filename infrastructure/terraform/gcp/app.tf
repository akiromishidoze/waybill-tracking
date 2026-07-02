# Application deployment resources for the Waybill Tracking platform on GCP.

# --- Kubernetes provider ------------------------------------------------------

provider "kubernetes" {
  host  = "https://${google_container_cluster.waybill.endpoint}"
  token = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.waybill.master_auth[0].cluster_ca_certificate
  )
}

data "google_client_config" "default" {}

# --- Namespace ----------------------------------------------------------------

resource "kubernetes_namespace" "waybill" {
  metadata {
    name = "waybill"
  }
}

# --- Shared secret ------------------------------------------------------------

resource "kubernetes_secret" "app_secrets" {
  metadata {
    name      = "waybill-secrets"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  data = {
    DATABASE_URL = "postgres://${google_sql_user.app_user.name}:${var.db_password}@${google_sql_database_instance.postgres.public_ip_address}:5432/${google_sql_database.waybill_db.name}"
    REDIS_URL    = "redis://${google_redis_instance.cache.host}:6379"
    JWT_SECRET   = var.jwt_secret
    ADMIN_EMAIL  = var.admin_email
    ADMIN_PASSWORD = var.admin_password
  }
}

# --- ConfigMap ----------------------------------------------------------------

resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "waybill-config"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  data = {
    ENV                  = var.environment
    KAFKA_BROKERS        = "kafka:9092"
    CORE_API_URL         = "http://core-api:8080"
    VITE_API_URL         = "http://${kubernetes_service.core_api.status[0].load_balancer[0].ingress[0].ip}:8080"
  }
}

# --- Core API -----------------------------------------------------------------

resource "kubernetes_deployment" "core_api" {
  metadata {
    name      = "core-api"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "core-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "core-api"
        }
      }

      spec {
        container {
          name  = "core-api"
          image = "${var.artifact_registry_url}/core-api:${var.image_tag}"
          port {
            container_port = 8080
          }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.app_secrets.metadata[0].name
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "core_api" {
  metadata {
    name      = "core-api"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    selector = {
      app = "core-api"
    }
    port {
      port        = 8080
      target_port = 8080
    }
    type = "LoadBalancer"
  }
}

# --- Dashboard ----------------------------------------------------------------

resource "kubernetes_deployment" "dashboard" {
  metadata {
    name      = "dashboard"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "dashboard"
      }
    }

    template {
      metadata {
        labels = {
          app = "dashboard"
        }
      }

      spec {
        container {
          name  = "dashboard"
          image = "${var.artifact_registry_url}/dashboard:${var.image_tag}"
          port {
            container_port = 3010
          }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "dashboard" {
  metadata {
    name      = "dashboard"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    selector = {
      app = "dashboard"
    }
    port {
      port        = 3010
      target_port = 3010
    }
    type = "LoadBalancer"
  }
}

# --- Analytics API ------------------------------------------------------------

resource "kubernetes_deployment" "analytics_api" {
  metadata {
    name      = "analytics-api"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "analytics-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "analytics-api"
        }
      }

      spec {
        container {
          name  = "analytics-api"
          image = "${var.artifact_registry_url}/analytics-api:${var.image_tag}"
          port {
            container_port = 8000
          }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.app_secrets.metadata[0].name
            }
          }
        }
      }
    }
  }
}

# --- Celery Worker ------------------------------------------------------------

resource "kubernetes_deployment" "celery_worker" {
  metadata {
    name      = "celery-worker"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "celery-worker"
      }
    }

    template {
      metadata {
        labels = {
          app = "celery-worker"
        }
      }

      spec {
        container {
          name    = "celery-worker"
          image   = "${var.artifact_registry_url}/analytics-api:${var.image_tag}"
          command = ["celery", "-A", "app.celery_app", "worker", "-l", "info"]
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.app_secrets.metadata[0].name
            }
          }
        }
      }
    }
  }
}

# --- Celery Beat ----------------------------------------------------------------

resource "kubernetes_deployment" "celery_beat" {
  metadata {
    name      = "celery-beat"
    namespace = kubernetes_namespace.waybill.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "celery-beat"
      }
    }

    template {
      metadata {
        labels = {
          app = "celery-beat"
        }
      }

      spec {
        container {
          name    = "celery-beat"
          image   = "${var.artifact_registry_url}/analytics-api:${var.image_tag}"
          command = ["celery", "-A", "app.celery_app", "beat", "-l", "info"]
          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.app_secrets.metadata[0].name
            }
          }
        }
      }
    }
  }
}
