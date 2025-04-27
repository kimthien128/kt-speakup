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
