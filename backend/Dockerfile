# Sử dụng image Python chính thức
FROM python:3.12-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép requirements.txt và cài đặt dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn, loại trừ thư mục models (đã có trong .dockerignore)
COPY . .

# Mở cổng backend
EXPOSE 8000

# Lệnh chạy ứng dụng
CMD ["python", "-m", "backend.server"]