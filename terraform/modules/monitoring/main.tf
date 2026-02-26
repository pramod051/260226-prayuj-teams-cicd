data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_security_group" "monitoring" {
  name        = "${var.environment}-prayuj-monitoring-sg"
  description = "Security group for monitoring instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prayuj-monitoring-sg"
  }
}

resource "aws_instance" "monitoring" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.medium"
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [aws_security_group.monitoring.id]
  key_name               = var.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              
              mkdir -p /opt/monitoring/{prometheus,grafana}
              
              cat > /opt/monitoring/docker-compose.yml <<'COMPOSE'
              version: '3.8'
              services:
                prometheus:
                  image: prom/prometheus:latest
                  container_name: prometheus
                  ports:
                    - "9090:9090"
                  volumes:
                    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
                    - prometheus-data:/prometheus
                  command:
                    - '--config.file=/etc/prometheus/prometheus.yml'
                    - '--storage.tsdb.path=/prometheus'
                  restart: always

                grafana:
                  image: grafana/grafana:latest
                  container_name: grafana
                  ports:
                    - "3001:3000"
                  environment:
                    - GF_SECURITY_ADMIN_PASSWORD=admin
                    - GF_USERS_ALLOW_SIGN_UP=false
                  volumes:
                    - grafana-data:/var/lib/grafana
                    - ./grafana/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
                  restart: always

              volumes:
                prometheus-data:
                grafana-data:
              COMPOSE
              
              cat > /opt/monitoring/prometheus/prometheus.yml <<'PROM'
              global:
                scrape_interval: 15s
                evaluation_interval: 15s

              scrape_configs:
                - job_name: 'ecs-tasks'
                  ec2_sd_configs:
                    - region: ap-south-1
                      port: 9090
                  relabel_configs:
                    - source_labels: [__meta_ec2_tag_aws_ecs_cluster_name]
                      target_label: cluster
                    - source_labels: [__meta_ec2_tag_aws_ecs_service_name]
                      target_label: service
              PROM
              
              cat > /opt/monitoring/grafana/datasource.yml <<'GRAF'
              apiVersion: 1
              datasources:
                - name: Prometheus
                  type: prometheus
                  access: proxy
                  url: http://prometheus:9090
                  isDefault: true
              GRAF
              
              cd /opt/monitoring
              docker-compose up -d
              EOF

  tags = {
    Name = "${var.environment}-prayuj-monitoring"
  }
}
