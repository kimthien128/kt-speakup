# 1. Cài đặt các gói cần thiết trên VPS

**Yêu cầu python 3.12**

```
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv nginx -y
```

# 2. Upload mã nguồn backend lên VPS

-   Cài git:\
    `sudo apt install git -y`
-   Clone:

```
git clone https://github.com/ten-ban/backend-cua-ban.git
cd kt-speakup
```

**_Lưu y: Copy file .env_**

# 3. Tạo môi trường ảo Python và cài dependencies

```
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

# 4. Chạy thử FastAPI

-   ubuntu:\
    `python3 -m backend.server`

# 5. Chạy FastAPI backend như một dịch vụ (service) trong Ubuntu

-   Tạo file:\
    `sudo nano /etc/systemd/system/ktspeakup.service`
-   Nội dung:

```
[Unit]
Description=FastAPI App
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/root/kt-speakup
ExecStart=/root/kt-speakup/venv/bin/python -m backend.server
Restart=always

[Install]
WantedBy=multi-user.target

```

-   Khởi động:

```
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable ktspeakup
sudo systemctl start ktspeakup

```

# 6. Cấu hình Nginx để đưa app ra cổng 80 (http)

`sudo nano /etc/nginx/sites-available/ktspeakup`

-   Nội dung:

```
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

```

-   Kích hoạt config:

```
sudo ln -s /etc/nginx/sites-available/ktspeakup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

```

# 7. Truy cập thử

`http://<vps-ip>`\

## Dùng HTTPS với Let’s Encrypt:

```
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx

```

## Cài MinIO

-   tải file cài: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
-   Tạo thư mục lưu trữ: vd: D:\Code\minio\data
-   Chạy cmd truy cập vào thư mục minio, chạy lệnh:
    -   set MINIO_ROOT_USER=your_new_username
    -   set MINIO_ROOT_PASSWORD=your_secure_password
    -   minio.exe server D:\Code\kt-speakup\minio\data --console-address ":9001"
    -   hoặc đặt biến global cho máy tính thì dùng setx MINIO_ROOT_USER your_new_username
-   Giữ cho server của minio luôn chạy

## download mongodb compass

## Vosk

-   Tải model vosk-model-en-us-0.22-lgraph (có thẻ chọn model khác): https://alphacephei.com/vosk/models
-   Giải nén & đặt trong folder "models"
-   Đặt lại biến môi trường VOSK_MODEL_DIR nếu khác model

## Tải model

huggingface-cli download TheBloke/Mistral-7B-Instruct-v0.1-GGUF mistral-7b-instruct-v0.1.Q4_K_M.gguf --local-dir D:\Code\kt-speakup\backend\models

Tải Visual Studio Build Tools:

Vào visualstudio.microsoft.com/visual-cpp-build-tools/.

Tải file cài đặt Build Tools for Visual Studio 2022.

Cài đặt thành phần C++:

Chạy file cài đặt.

Trong giao diện Visual Studio Installer, chọn workload:

Desktop development with C++.

Đảm bảo các thành phần sau được chọn:

MSVC v143 - VS 2022 C++ x64/x86 build tools (hoặc phiên bản mới nhất).

Windows 10/11 SDK (cho compatiblity).

Nhấn Install (khoảng 2-5GB).

python -m pip install llama-cpp-python

## Piper

-   https://github.com/rhasspy/piper
-   Tải file "piper_windows_amd64.zip" từ https://github.com/rhasspy/piper/releases
-   Giải nén để có được folder "piper"
-   Tải 2 file cấu hình cho voice (chọn giọng đọc bất kỳ) "en_US-amy-medium.onnx", và "en_US-amy-medium.onnx.json" vào folder piper vừa giải nén
-   Đặt lại biến môi trường cho PIPER_VOICE nếu khác giọng đọc

## Chạy server

-   python -m backend.server
