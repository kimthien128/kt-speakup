# Backend

## Cài đặt môi trường python

**_Yêu cầu python 3.12.x_**

-   Đứng ở thư mục gốc `kt-speakup`

```python
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

## Cài MinIO

-   Tải file và lưu ở "D:\minio" (đường dẫn có thể tùy chọn bất kỳ, nhưng đường dẫn này sẽ được sử dụng ở các lệnh cmd bên dưới):\
    https://dl.min.io/server/minio/release/windows-amd64/minio.exe
-   Tạo thư mục "data" để lưu trữ hình ảnh & âm thanh: vd: "D:\minio\data"
-   Chạy cmd truy cập vào thư mục chứa file minio.exe, chạy lệnh:
    ```cmd
    cd D:\minio
    set MINIO_ROOT_USER=admin
    set MINIO_ROOT_PASSWORD=abc@123A
    minio.exe server D:\minio\data --console-address ":9001"
    ```
-   Hoặc đặt biến global cho máy tính thì dùng `setx MINIO_ROOT_USER your_new_username`
-   Có thể đặt username và password tự chọn, nhưng cần thay đổi tương ứng trong biến môi trường "backend/.env"
-   Giữ cho server của minio luôn chạy khi dùng app

## Database MongoDB

-   Biến môi trường "backend/.env" đã có sẵn kết nối tới Mongo Cloud thông qua connection string `MONGODB_URL`
    -   Dùng tài khoản bên dưới để đăng nhập ứng dụng với quyền admin
    ```
    username: admin.speakup@ktstudio.vn
    password: abc@123A
    ```
-   Có thể thay thế kết nối đến tài khoản MongoDB Cloud khác\
    _Lưu ý: Mở Network Access đến ip: 0.0.0.0/0 để kết nối được ở mọi nơi_
-   MongoDB tự tạo Database, Collection và Document và 1 tài khoản admin như trên khi ứng dụng khởi chạy.
-   Nếu không dùng Mongo Cloud, triển khai MongoDB Community Server ở local và thay thế connection string thành:\
    `MONGODB_URL=mongodb://localhost:27017`
    -   Hướng dẫn cài MongoDB Community Server ở local:\
        `https://www.youtube.com/watch?v=tC49Nzm6SyM&ab_channel=AmitThinks`
-   Có thể cài thêm Mongo Compass (GUI) hoặc Mongo Shell (command line) để kiểm tra nội dung database.
-   Với tài khoản user thông thường có thể thực hiện bằng chức năng đăng ký xác thực qua email hoặc vào Admin Panel trong ứng dụng (với tài khoản admin) để tạo tài khoản.

## Run server backend

-   _Đứng ở thư mục gốc `kt-speakup` chạy lệnh:_\
    `python -m backend.server`

## Optional (Tùy chọn không bắt buộc cài đặt)

-   Là các model AI chạy local, được dùng trong giai đoạn phát triển app để đảm bảo tính liên tục & không giới hạn số lượng token như các dịch vụ api.

### Vosk (SpeedToText)

-   Tải model vosk-model-en-us-0.22-lgraph (có thẻ chọn model khác):\
    https://alphacephei.com/vosk/models
-   Đặt lại biến môi trường trong file "backend/.env" `VOSK_MODEL_DIR` nếu dùng model khác
-   Giải nén & đặt trong folder "backend/models"

### Mistral (Generate) (rất nặng, không khuyến khích dùng, chỉ áp dụng để test ứng dụng giai đoạn dev)

python -m pip install llama-cpp-python

huggingface-cli download TheBloke/Mistral-7B-Instruct-v0.1-GGUF mistral-7b-instruct-v0.1.Q4_K_M.gguf --local-dir D:\Code\kt-speakup\backend\models

-   Tải Visual Studio Build Tools: Vào visualstudio.microsoft.com/visual-cpp-build-tools/.
-   Tải file cài đặt Build Tools for Visual Studio 2022.
-   Cài đặt thành phần C++: Chạy file cài đặt.
-   Trong giao diện Visual Studio Installer, chọn workload: Desktop development with C++.
-   Đảm bảo các thành phần sau được chọn: MSVC v143 - VS 2022 C++ x64/x86 build tools (hoặc phiên bản mới nhất).
-   Windows 10/11 SDK (cho compatiblity).
-   Nhấn Install (khoảng 2-5GB).

### Piper (TextToSpeech)

-   https://github.com/rhasspy/piper
-   Tải file "piper_windows_amd64.zip" từ https://github.com/rhasspy/piper/releases
-   Giải nén để có được folder "piper"
-   Tải 2 file cấu hình cho voice (chọn giọng đọc bất kỳ) "en_US-amy-medium.onnx", và "en_US-amy-medium.onnx.json" vào folder piper vừa giải nén
-   Đặt lại biến môi trường trong "backend/.env" `PIPER_VOICE` nếu khác giọng đọc

# Frontend

**_Yêu cầu có Nodejs >= v20.0.0 và npm đi kèm_**

```Nodejs
cd frontend
npm install
npm run dev
```

-   Truy cập : http://localhost:5173/ để sử dụng
