**_Các file cấu hình môi trường không được public trên github_**

# Backend

## Cài đặt môi trường python

**_Yêu cầu chính xác python 3.12.x_**

- Kiểm tra phiên bản python 3.12 đã có chưa `py -3.12 --version`, nếu chưa có cần phải cài đặt để có thể khởi chạy backend.
- Đứng ở thư mục gốc `kt-speakup`

```python
py -3.12 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

## Cài FFmpeg
- Tải FFmpeg trực tiếp từ https://www.gyan.dev/ffmpeg/builds/
- Cuộn đến session `release builds` chọn bản mới nhất (VD `ffmpeg-7.1.1-essentials_build.zip`)
- Giải nén file zip (VD giải nén vào `C:\ffmpeg-7.1.1-essentials_build`)
- Thêm vào PATH:
  - Mở "System Properties" > "Advanced" > "Environment Variables"
  - Thêm đường dẫn đến thư mục `bin` của FFmpeg vào biến môi trường PATH (VD: `C:\ffmpeg-7.1.1-essentials_build\bin`)

## Cài MinIO
- Tải file thực thi:\
  https://dl.min.io/server/minio/release/windows-amd64/minio.exe
- Tải xuống & lưu tại 1 thư mục riêng để dễ quản lý `D:\minio`
- Tạo thư mục `data` để lưu trữ hình ảnh & âm thanh (VD `D:\minio\data`)
- Chạy cmd truy cập vào thư mục chứa file minio.exe, chạy các lệnh:
  ```cmd
  cd D:\minio
  set MINIO_ROOT_USER=admin
  set MINIO_ROOT_PASSWORD=abc@123A
  minio.exe server D:\minio\data --console-address ":9001"
  ```
- Giữ cho server của minio luôn chạy khi dùng app

#### Optional - Tùy chỉnh thêm (nếu cần)
- Để không phải đặt lại biến username và password cho minio mỗi lần khởi chạy, có thể khởi tạo biến global vĩnh viễn cho máy tính bằng lệnh:
  ```cmd
  setx MINIO_ROOT_USER admin
  setx MINIO_ROOT_PASSWORD abc@123A
  ```
  _Lưu ý: Phải khởi động lại máy tính để áp dụng biến global._
- Có thể đặt username và password tùy chọn, nhưng cần thay đổi tương ứng trong biến môi trường `backend/.env`


## Database MongoDB
- Không cần cài đặt gì thêm, biến môi trường `backend/.env` đã có sẵn kết nối tới Mongo Cloud thông qua connection string `MONGODB_URL`.
#### Optional - Tùy chỉnh thêm (nếu cần)
- Có thể thay thế kết nối đến tài khoản MongoDB Cloud khác\
  _Lưu ý: Mở Network Access đến ip: 0.0.0.0/0 để kết nối được ở mọi nơi_
- MongoDB tự tạo Database, Collection và Document và 1 tài khoản admin mặc định khi ứng dụng khởi chạy.
- Trong trường hợp Mongo Cloud bị lỗi, cần triển khai MongoDB Community Server ở local và thay thế connection string thành: `MONGODB_URL=mongodb://localhost:27017`
  - Hướng dẫn cài MongoDB Community Server ở local:\
    `https://www.youtube.com/watch?v=tC49Nzm6SyM&ab_channel=AmitThinks`
- Có thể cài thêm Mongo Compass (GUI) hoặc Mongo Shell (command line) để kiểm tra nội dung database.

## Run server backend

- _Đứng ở thư mục gốc `kt-speakup` chạy lệnh:_\
  `python -m backend.server`

## Optional (Tùy chọn không bắt buộc cài đặt)

- Bên dưới là các model AI chạy local, được dùng trong giai đoạn phát triển app để đảm bảo tính liên tục & không giới hạn số lượng token cho các dịch vụ api.

### Vosk (SpeedToText)

- Tải model `vosk-model-en-us-0.22-lgraph` (có thẻ chọn model khác):\
  https://alphacephei.com/vosk/models
- Đặt lại biến môi trường trong file "backend/.env" `VOSK_MODEL_DIR` nếu dùng model khác
- Giải nén & đặt trong folder "backend/models"
- Khả năng phân tích giọng nói ở mức trung bình khá, nếu dùng model lớn hơn `vosk-model-en-us-0.42-gigaspeech` sẽ có cải thiện nhưng thời gian phân tích và generate ra kết quả lâu hơn

### Piper (TextToSpeech)

- Docs: `https://github.com/rhasspy/piper`
- Tải file https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip
- Giải nén vào `backend/models` để có được folder "piper" trong thư mục models
- Nghe thử giọng đọc tại: https://rhasspy.github.io/piper-samples/ để chọn được giọng đọc yêu thích
- Tải 2 file cấu hình từ https://github.com/rhasspy/piper/blob/master/VOICES.md cho voice đã chọn: ví dụ chọn
  - Language: en_US (English, United States)
  - Voice : hfc_male
  - Quality: medium\
    như vậy cần tải 2 file `en_US-hfc_male-medium.onnx`, và `en_US-hfc_male-medium.onnx.json` bỏ vào folder piper vừa giải nén
- Đặt lại biến môi trường trong "backend/.env" `PIPER_VOICE` nếu chọn giọng đọc khác
- Thêm value `piper` vào danh sách `ENABLED_AI_CLIENTS` trong biến môi trường `backend/.env`

# Frontend

**_Yêu cầu có Nodejs >= v20.0.0 và npm đi kèm_**

- Đứng ở thư mục frontend để gọi:

```cmd
cd frontend
npm install
npm run dev
```

- Truy cập : http://localhost:5173/ để sử dụng

# Login - Register
- Dùng tài khoản bên dưới để login vào ứng dụng với quyền admin
  ```
  username: admin.speakup@ktstudio.vn
  password: abc@123A
  ```
- Để tạo tài khoản user thông thường, có thể tạo bằng chức năng `Register` của ứng dụng và xác thực qua email hoặc dùng `Admin Panel` trong ứng dụng (với tài khoản admin) để tạo.
