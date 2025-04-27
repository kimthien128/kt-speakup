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
