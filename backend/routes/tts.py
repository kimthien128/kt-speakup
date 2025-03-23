from fastapi import APIRouter, Request, Response
from fastapi.responses import FileResponse
import os
import time
from gtts import gTTS
import ffmpeg
import subprocess
from utils import BASE_DIR, CACHE_DIR

router = APIRouter()

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
        audio_path = os.path.join(CACHE_DIR, audio_filename)
        wav_path = os.path.join(CACHE_DIR, f"output_{timestamp}.wav") # Piper tạm thời tạo wav trước
        
        # Chỉ tạo file nếu chưa tồn tại
        if not os.path.exists(audio_path):
            if method == 'gtts':
                # Tạo audio với gTTS
                tts = gTTS(text=text, lang='en')
                tts.save(audio_path)
                print(f'Generated audio with gTTS: {audio_path}')
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
                stream = ffmpeg.output(stream, audio_path, acodec='mp3')
                ffmpeg.run(stream, quiet=True)
                os.remove(wav_path)
                print(f'Generated audio with Piper: {audio_path}')
            else:
                return {'error': f'Unsupported TTS method: {method}'}, 400
        
        # Kiểm tra file tồn tại
        if not os.path.exists(audio_path):
            return {'error': 'Audio file not generated'}, 500
        
        # Trả về file audio với header x-audio-filename
        return FileResponse(
            audio_path,
            media_type="audio/mp3",
            headers={"x-audio-filename": audio_filename}
        )
    except Exception as e:
        print(f'Error: {e}')
        return {'error': str(e)}, 500