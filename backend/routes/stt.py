from fastapi import APIRouter, Request, Query
from vosk import Model, KaldiRecognizer
import ffmpeg
import wave
import json
import os
import time
import httpx
import asyncio
import assemblyai as aai
from utils import ASSEMBLYAI_API_KEY, VOSK_MODEL_DIR

router = APIRouter()

# API key AssemblyAI
aai.settings.api_key = ASSEMBLYAI_API_KEY

# Load Vosk model
model = Model(f"backend/models/{VOSK_MODEL_DIR}")
rec = KaldiRecognizer(model, 16000)

@router.post("")
async def stt(request: Request, method: str = Query("vosk")):
    # Nhận audioBlob (WebM) từ frontend
    audio_blob = await request.body()
    print(f"Received audio size: {len(audio_blob)} bytes")
    if not audio_blob:
        return {'error': 'No audio data received'}, 400
    
    # Tạo tên file duy nhất với timestamp
    timestamp = int(time.time() * 1000)  # Miliseconds
    webm_path = f"backend/input_{timestamp}.webm"
    wav_path = f"backend/input_{timestamp}.wav"
    
    try:
        # Đọc file webm
        with open(webm_path, 'wb') as f:
            f.write(audio_blob)
            
        # Convert WebM sang WAV bằng ffmpeg-python
        try:
            stream = ffmpeg.input(webm_path)
            stream = ffmpeg.output(stream, wav_path, ar=16000, ac=1, format='wav')
            ffmpeg.run(stream, quiet=True) # Tắt Warning [opus] Error parsing Opus packet header
            print("Converted to WAV")
        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return {'error': 'Failed to convert audio'}, 500
        
        # Vosk xử lý WAV, Dùng with để mở file WAV, trả transcript trước khi xóa
        transcript = ''
        if method == 'vosk':
            with wave.open(wav_path, 'rb') as wf:
                while True:
                    data = wf.readframes(4000)
                    if len(data) == 0:
                        break
                    if rec.AcceptWaveform(data):
                        result = json.loads(rec.Result())
                        print(f"Partial result: {result}")
                        transcript = result.get('text', '')
                        break  # Thoát ngay khi có kết quả
                if not transcript:  # Nếu chưa có partial result
                    result = json.loads(rec.FinalResult())
                    print(f"Final result: {result}")
                    transcript = result.get('text', '')
        
        elif method == 'assemblyai':
            print('Starting AssemblyAI transcription...')
            transcriber = aai.Transcriber()
            # Gọi API AssemblyAI với file WAV
            transcript_obj = transcriber.transcribe(wav_path)
            if transcript_obj.status == aai.TranscriptStatus.completed:
                transcript = transcript_obj.text or "No speech detected"
                print(f"AssemblyAI transcript: {transcript}")
            elif transcript_obj.status == aai.TranscriptStatus.error:
                print(f"AssemblyAI error: {transcript_obj.error}")
                transcript = ''
            else:
                print(f"AssemblyAI status: {transcript_obj.status}")
                transcript = ''
            if not transcript:
                print("Warning: AssemblyAI returned empty transcript")
        
        else:
            return {'error': f'Unsupported STT method: {method}'}, 400
    except Exception as e:
        print(f'Error: {e}')
        return {'error': str(e)}, 500
    finally:
        # Xóa file âm thanh
        for file_path in [webm_path, wav_path]:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Deleted {file_path}")
                except OSError as e:
                    print(f"Warning: Could not delete files {file_path} - {e}")
            
    return {'transcript': transcript}