output "endpoint" {
  value = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  value = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  value = aws_docdb_cluster.main.port
}

output "security_group_id" {
  value = aws_security_group.documentdb.id
}
