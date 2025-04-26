# Backend:

# 1. Cài đặt các gói cần thiết trên VPS

-   mở CORS tới ip, domain của vpn (trong file backend/config/app_config.py)

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

-   Xem log trưc tiep:\
    `sudo journalctl -u ktspeakup -f`

# Frontend:

Nếu server mạnh thì run npm trên server, còn không thì chỉ deploy file tĩnh

## Cai nodejs >= v20.0.0

```
sudo apt install -y nodejs
sudo apt install npm -y
node -v
npm -v
```

Nếu version < v20.0.0:

```
npm install -g n
n latest
node -v
npm install -g npm
npm -v
```

## Build frontend tren may local

`npm run build`

```
cd kt-speakup/frontend
npm install
```

Copy lên VPS (nếu build ở local):\
`scp -r dist/* root@your-vps-ip:/var/www/kt-speakup`\
`scp -r dist/* root@157.230.242.152:/var/www/kt-speakup`

Hoặc nếu bạn đang ở trong VPS rồi thì move thư mục dist vào:\
`mv dist /var/www/kt-speakup`

## Cấp quyền để truy cập folder dist cho các user gọi từ web

```
sudo chown -R www-data:www-data /var/www/kt-speakup
sudo chmod -R 755 /var/www/kt-speakup
```

## nếu upload lại thì nên xóa đi rồi up lại và Cập nhật quyền để overwrite

`sudo rm -rf /var/www/kt-speakup/*`

```
sudo chown -R root:www-data /var/www/kt-speakup
sudo chmod -R 755 /var/www/kt-speakup
```

# 6. Cấu hình Nginx để đưa app ra cổng 80 (http)

### proxy_pass

`sudo nano /etc/nginx/sites-available/kt-speakup`

-   Nội dung:\
    Đây là cấu hình dùng để "forward" tất cả request tới backend (FastAPI) đang chạy ở localhost:8000.

👉 Phù hợp khi bạn chạy backend bằng Uvicorn, và dùng Nginx làm cổng chuyển tiếp ra ngoài.

```
server {
    listen 80;
    server_name 157.230.242.152; #your_domain_or_ip

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

```

### trường hợp “frontend đã build rồi” thì dùng nội dung này

```
server {
    listen 80;
    server_name speakup.ktstudio.vn; #your_domain_or_ip

    root /var/www/kt-speakup;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

-   Kích hoạt config:

```
Tạo symbolic link để kích hoạt site
sudo ln -s /etc/nginx/sites-available/kt-speakup /etc/nginx/sites-enabled/

Kiểm tra cấu hình Nginx có hợp lệ không
sudo nginx -t

Khởi động lại Nginx
sudo systemctl restart nginx

```

# 7. Truy cập thử

`http://<vps-ip>`\

## Dùng HTTPS với Let’s Encrypt:

```
đổi biến môi trường của frontend sang https : VITE_API_URL=https://157.230.242.152:8000
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx
hoặc
sudo certbot --nginx -d speakup.ktstudio.vn
sudo nginx -t
sudo systemctl restart nginx
```

## Dùng Nginx làm reverse proxy có SSL cho backend luôn để đồng bộ

(Truy cập backend qua HTTPS: https://speakup.ktstudio.vn/api)

-   sửa file cấu hình nginx : sudo nano /etc/nginx/sites-available/kt-speakup

```
server {
    server_name speakup.ktstudio.vn;

    root /var/www/kt-speakup;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ✅ Thêm đoạn này để proxy API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/speakup.ktstudio.vn/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/speakup.ktstudio.vn/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = speakup.ktstudio.vn) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name speakup.ktstudio.vn;
    return 404; # managed by Certbot
}
```

-   Cập nhật .env trong frontend: `VITE_API_URL=https://speakup.ktstudio.vn/api` Sau đó chạy lại:

## sửa luôn biến minio_endpoint trong .env của backend và thêm đoạn nginx sau:

### file cấu hình biến môi trường cho minio:

`sudo nano /etc/default/minio`\

```
sudo systemctl daemon-reexec
sudo systemctl restart minio
```

(https://speakup.ktstudio.vn/storage)

```
location /storage/ {
    proxy_pass http://localhost:9000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

-   Kích hoạt file config:

```
endpoint='localhost:9000'
secure=True
```

```
sudo ln -sf /etc/nginx/sites-available/kt-speakup /etc/nginx/sites-enabled/kt-speakup
sudo nginx -t  # kiểm tra cấu hình
sudo systemctl reload nginx
```

-   sửa cấu hình khởi tạo minio_client.py

`npm run build`

##

##

##

## Cài MinIO

-   tải file cài: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
-   Tạo thư mục lưu trữ: vd: D:\Code\minio\data
-   Chạy cmd truy cập vào thư mục minio, chạy lệnh:
    -   set MINIO_ROOT_USER=your_new_username
    -   set MINIO_ROOT_PASSWORD=your_secure_password
    -   `minio.exe server D:\Code\kt-speakup\minio\data --console-address ":9001"`
    -   hoặc đặt biến global cho máy tính thì dùng setx MINIO_ROOT_USER your_new_username
-   Giữ cho server của minio luôn chạy

## download mongodb compass

## Vosk

-   Tải model vosk-model-en-us-0.22-lgraph (có thẻ chọn model khác): https://alphacephei.com/vosk/models
-   Giải nén & đặt trong folder "models"
-   Đặt lại biến môi trường VOSK_MODEL_DIR nếu khác model

## Tải model

python -m pip install llama-cpp-python

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

## Piper

-   https://github.com/rhasspy/piper
-   Tải file "piper_windows_amd64.zip" từ https://github.com/rhasspy/piper/releases
-   Giải nén để có được folder "piper"
-   Tải 2 file cấu hình cho voice (chọn giọng đọc bất kỳ) "en_US-amy-medium.onnx", và "en_US-amy-medium.onnx.json" vào folder piper vừa giải nén
-   Đặt lại biến môi trường cho PIPER_VOICE nếu khác giọng đọc

## Chạy server

-   python -m backend.server
