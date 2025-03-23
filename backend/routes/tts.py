from fastapi import APIRouter, Request, Response
from fastapi.responses import FileResponse
from gtts import gTTS
from utils import BASE_DIR, CACHE_DIR
from minio import Minio
import os
import time
import ffmpeg
import subprocess

router = APIRouter()

# Kết nối MinIO
minio_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

@router.post("")
async def tts(request: Request):
    try:
        data = await request.json()
        text = data.get('text','')
        if not text:
            return {'error': 'No text provided'}, 400
        
        # Lấy method từ query string, mặc định là gtts
        method = request.query_params.get('method', 'gtts')
        
        # Phân biệt từ đơn và đoạn chat
        is_single_word = ' ' not in text
        timestamp = int(time.time() * 1000)
        audio_filename = f"{text}.mp3" if is_single_word else f"output_{timestamp}.mp3"
        temp_path = f"temp_{timestamp}.mp3"
        wav_path = os.path.join(CACHE_DIR, f"output_{timestamp}.wav") # Piper vẫn dùng CACHE_DIR cho WAV tạm
        
        # Tạo file MP3 tạm
        if method == 'gtts':
            # Tạo audio với gTTS
            tts = gTTS(text=text, lang='en')
            tts.save(temp_path)
            print(f'Generated audio with gTTS: {temp_path}')
        elif method == 'piper':
            piper_exe = os.path.join(BASE_DIR, "piper", "piper.exe")
            model_path = os.path.join(BASE_DIR, "piper", os.getenv("PIPER_VOICE"))
            cmd = [piper_exe, "--model", model_path, "--output_file", wav_path]
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            process.stdin.write(text)
            process.stdin.close()
            stdout, stderr = process.communicate()
            if process.returncode != 0:
                print(f'Piper error: {stderr}')
                return {'error': 'Failed to generate audio with Piper'}, 500
            
            # Convert WAV sang MP3
            stream = ffmpeg.input(wav_path)
            stream = ffmpeg.output(stream, temp_path, acodec='mp3')
            ffmpeg.run(stream, quiet=True)
            os.remove(wav_path)
            print(f'Generated audio with Piper: {temp_path}')
        else:
            return {'error': f'Unsupported TTS method: {method}'}, 400
        
        # Upload file lên MinIO thay vì kiểm tra CACHE_DIR
        minio_client.fput_object("audio-bucket", audio_filename, temp_path)
        print(f'Uploaded to MinIO: {audio_filename}')
        
        # Tạo URL từ MinIO để trả về
        audio_url = minio_client.presigned_get_object("audio-bucket", audio_filename)
        print(f'Returning audio URL: {audio_url}')
        
        # Xóa file tạm sau khi upload
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Trả về URL trong header
        return Response(
            status_code=200,
            headers={
                "x-audio-url": audio_url # Thêm URL để frontend dùng
            }
        )
    except Exception as e:
        print(f'Error: {e}')
        # Xóa file tạm nếu có lỗi
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        if 'wav_path' in locals() and os.path.exists(wav_path):
            os.remove(wav_path)
        return {'error': str(e)}, 500