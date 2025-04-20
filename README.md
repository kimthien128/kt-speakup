## Cài python v3.12

## Cài đặt từ file requirements.txt

pip install -r requirements.txt

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

## MinIO

-   tải file cài: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
-   Tạo thư mục lưu trữ: vd: D:\Code\minio\data
-   Chạy cmd truy cập vào thư mục minio, chạy lệnh:
    -   set MINIO_ROOT_USER=your_new_username
    -   set MINIO_ROOT_PASSWORD=your_secure_password
    -   minio.exe server D:\Code\kt-speakup\minio\data --console-address ":9001"
    -   hoặc đặt biến global cho máy tính thì dùng setx MINIO_ROOT_USER your_new_username
-   Giữ cho server của minio luôn chạy

## download mongodb compass

## Extension "File Tree Generator"

-   tạo cây thư mục dưới dạng Markdown : shinotatwu-ds.file-tree-generator

## Chạy server

-   python -m backend.server

## Docker

-   docker volume rm ai-models
-   docker volume create ai-models
-   Copy models vào volume:
-   docker run --rm -v ai-models:/models -v D:\Code\kt-speakup\backend\models:/source busybox sh -c "cp -r /source/\* /models/"
-   Tạo image: docker-compose build
-   Chạy: docker-compose up -d
-   Dùng và xóa: docker-compose down
