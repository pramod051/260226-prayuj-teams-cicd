resource "aws_docdb_subnet_group" "main" {
  name       = "${var.environment}-prayuj-docdb-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.environment}-prayuj-docdb-subnet-group"
  }
}

resource "aws_security_group" "documentdb" {
  name        = "${var.environment}-prayuj-documentdb-sg"
  description = "Security group for DocumentDB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prayuj-documentdb-sg"
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.environment}-prayuj-docdb-cluster"
  engine                  = "docdb"
  master_username         = var.master_username
  master_password         = var.master_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.environment}-prayuj-docdb-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.documentdb.id]
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Name = "${var.environment}-prayuj-docdb-cluster"
  }
}

resource "aws_docdb_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.environment}-prayuj-docdb-instance-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  tags = {
    Name = "${var.environment}-prayuj-docdb-instance-${count.index + 1}"
  }
}
