# repositories/postgres_repository.py
# Triển khai BaseRepository cho PostgreSQL.
# Sử dụng asyncpg để thực hiện các truy vấn SQL.
# Tuân thủ OCP: Chỉ cần tạo file này khi đổi sang PostgreSQL, không cần sửa code khác.
# Cần điều chỉnh logic truy vấn (ví dụ: xử lý $push/$pull của MongoDB bằng cách khác trong SQL).