# Application deployment resources for the Waybill Tracking platform on AWS.

# --- IAM ----------------------------------------------------------------------

resource "aws_iam_role" "ecs_execution" {
  name = "waybill-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "waybill-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# --- Networking / Security ----------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "waybill-alb-sg"
  description = "Allow inbound HTTP/HTTPS traffic to the ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.alb_ingress_cidr
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.alb_ingress_cidr
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "core_api" {
  name        = "waybill-core-api-sg"
  description = "Allow traffic from the ALB to the core-api ECS service"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "dashboard" {
  name        = "waybill-dashboard-sg"
  description = "Allow traffic from the ALB to the dashboard ECS service"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3010
    to_port         = 3010
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Load Balancer ------------------------------------------------------------

resource "aws_lb" "waybill" {
  name               = "waybill-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
}

resource "aws_lb_target_group" "core_api" {
  name        = "waybill-core-api"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group" "dashboard" {
  name        = "waybill-dashboard"
  port        = 3010
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.waybill.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dashboard.arn
  }
}

resource "aws_lb_listener_rule" "core_api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.core_api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# --- CloudWatch Logs ----------------------------------------------------------

resource "aws_cloudwatch_log_group" "core_api" {
  name              = "/ecs/waybill-core-api"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "dashboard" {
  name              = "/ecs/waybill-dashboard"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "analytics_api" {
  name              = "/ecs/waybill-analytics-api"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "celery_worker" {
  name              = "/ecs/waybill-celery-worker"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "celery_beat" {
  name              = "/ecs/waybill-celery-beat"
  retention_in_days = 7
}

# --- ECS Task Definitions -----------------------------------------------------

locals {
  base_env = [
    { name = "ENV", value = var.environment },
    { name = "DATABASE_URL", value = "postgres://${aws_rds_cluster.postgres.master_username}:${var.db_password}@${aws_rds_cluster.postgres.endpoint}/${aws_rds_cluster.postgres.database_name}" },
    { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
    { name = "KAFKA_BROKERS", value = aws_msk_cluster.kafka.bootstrap_brokers },
    { name = "JWT_SECRET", value = var.jwt_secret },
    { name = "ADMIN_EMAIL", value = var.admin_email },
    { name = "ADMIN_PASSWORD", value = var.admin_password },
  ]
}

resource "aws_ecs_task_definition" "core_api" {
  family                   = "waybill-core-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "core-api"
      image = "${var.ecr_repository_url}/core-api:${var.image_tag}"
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      environment = local.base_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.core_api.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "core-api"
        }
      }
      essential = true
    }
  ])
}

resource "aws_ecs_task_definition" "dashboard" {
  family                   = "waybill-dashboard"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "dashboard"
      image = "${var.ecr_repository_url}/dashboard:${var.image_tag}"
      portMappings = [
        {
          containerPort = 3010
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "ENV", value = var.environment },
        { name = "VITE_API_URL", value = "http://${aws_lb.waybill.dns_name}/api" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.dashboard.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "dashboard"
        }
      }
      essential = true
    }
  ])
}

resource "aws_ecs_task_definition" "analytics_api" {
  family                   = "waybill-analytics-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "analytics-api"
      image = "${var.ecr_repository_url}/analytics-api:${var.image_tag}"
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      environment = concat(local.base_env, [
        { name = "CORE_API_URL", value = "http://core-api:8080" }
      ])
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.analytics_api.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "analytics-api"
        }
      }
      essential = true
    }
  ])
}

resource "aws_ecs_task_definition" "celery_worker" {
  family                   = "waybill-celery-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "celery-worker"
      image = "${var.ecr_repository_url}/analytics-api:${var.image_tag}"
      command = ["celery", "-A", "app.celery_app", "worker", "-l", "info"]
      environment = concat(local.base_env, [
        { name = "CORE_API_URL", value = "http://core-api:8080" }
      ])
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.celery_worker.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "celery-worker"
        }
      }
      essential = true
    }
  ])
}

resource "aws_ecs_task_definition" "celery_beat" {
  family                   = "waybill-celery-beat"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "celery-beat"
      image = "${var.ecr_repository_url}/analytics-api:${var.image_tag}"
      command = ["celery", "-A", "app.celery_app", "beat", "-l", "info"]
      environment = concat(local.base_env, [
        { name = "CORE_API_URL", value = "http://core-api:8080" }
      ])
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.celery_beat.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "celery-beat"
        }
      }
      essential = true
    }
  ])
}

# --- ECS Services -------------------------------------------------------------

resource "aws_ecs_service" "core_api" {
  name            = "core-api"
  cluster         = aws_ecs_cluster.waybill.id
  task_definition = aws_ecs_task_definition.core_api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.core_api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.core_api.arn
    container_name   = "core-api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "dashboard" {
  name            = "dashboard"
  cluster         = aws_ecs_cluster.waybill.id
  task_definition = aws_ecs_task_definition.dashboard.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.dashboard.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.dashboard.arn
    container_name   = "dashboard"
    container_port   = 3010
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "analytics_api" {
  name            = "analytics-api"
  cluster         = aws_ecs_cluster.waybill.id
  task_definition = aws_ecs_task_definition.analytics_api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.core_api.id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "celery_worker" {
  name            = "celery-worker"
  cluster         = aws_ecs_cluster.waybill.id
  task_definition = aws_ecs_task_definition.celery_worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.core_api.id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "celery_beat" {
  name            = "celery-beat"
  cluster         = aws_ecs_cluster.waybill.id
  task_definition = aws_ecs_task_definition.celery_beat.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.core_api.id]
    assign_public_ip = false
  }
}
