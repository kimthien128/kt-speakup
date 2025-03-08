from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from vosk import Model, KaldiRecognizer
import ffmpeg
import wave
import json
import os
import time
import requests
from gtts import gTTS
import assemblyai as aai
import subprocess
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

from dotenv import load_dotenv # Để đọc biến môi trường

app = Flask(__name__)
CORS(app, resources={r"/*":{"origins":"http://localhost:5173"}}, expose_headers=['X-Audio-Filename']) # Chỉ cho phép Vite local truy cập tới backend

# Load biến môi trường
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = os.getenv("HF_API_URL")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
VOSK_MODEL_DIR = os.getenv("VOSK_MODEL_DIR", "vosk-model-en-us-0.22-lgraph")

# API key AssemblyAI
aai.settings.api_key = ASSEMBLYAI_API_KEY

# Load Vosk model
model = Model(f"backend/models/{VOSK_MODEL_DIR}")
rec = KaldiRecognizer(model, 16000)

# Load distilgpt2 model
distilgpt2_model_path = "distilgpt2"
tokenizer = AutoTokenizer.from_pretrained(distilgpt2_model_path)
model_distilgpt2 = AutoModelForCausalLM.from_pretrained(distilgpt2_model_path)

# Thư mục cache
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Folder backend
CACHE_DIR = os.path.join(BASE_DIR, "cache")
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Hàm dọn cache (time to live = 1 giờ)
def clean_cache():
    now = time.time()
    for file in os.listdir(CACHE_DIR):
        file_path = os.path.join(CACHE_DIR, file)
        if os.path.isfile(file_path) and now - os.path.getmtime(file_path) > 3600:
            os.remove(file_path)
            print(f'Deleted expired cache: {file_path}')
            
# Speech to text
@app.route('/stt', methods=['POST'])
def stt():
    # Nhận audioBlob (WebM) từ frontend
    audio_blob = request.get_data()
    print(f"Received audio size: {len(audio_blob)} bytes")
    if not audio_blob:
        return jsonify({'error': 'No audio data received'}), 400
    
    # Lấy tham số method từ request
    method = request.args.get('method', 'vosk') # Mặc định là vosk
    
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
            return jsonify({'error': 'Failed to convert audio'}), 500
        
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
            transcript_obj = transcriber.transcribe(wav_path)
            if transcript_obj.status == "completed":
                transcript = transcript_obj.text or "No speech detected"
                print(f"AssemblyAI transcript: {transcript}")
            else:
                print(f"AssemblyAI error: {transcript_obj.error}")
                transcript = ''
            if not transcript:
                print("Warning: AssemblyAI returned empty transcript")
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': str(e)}), 500
    finally:
        # Xóa file âm thanh
        for file_path in [webm_path, wav_path]:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Deleted {file_path}")
                except OSError as e:
                    print(f"Warning: Could not delete files {file_path} - {e}")
            
    return jsonify({'transcript': transcript})

# Gọi các model trong Hugging Face
@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        if not transcript:
            return jsonify({'error':'No transcript provided'}), 400
        
        # Lấy method từ query parameter, mặc định là blenderbot
        method = request.args.get('method', 'blenderbot')
        
        # Chọn URL API dựa trên method
        if method == 'blenderbot':
            api_url = f'{HF_API_URL}/facebook/blenderbot-400M-distill'
            prompt = f"Answer this question: {transcript}" # Thêm prompt để hướng dẫn AI trả lời liên quan đến transcript
            max_length = 50
        elif method == 'zephyr':
            api_url = f'{HF_API_URL}/HuggingFaceH4/zephyr-7b-beta'
            prompt = f"Human: {transcript}\nAssistant: " # Định dạng hội thoại
            max_length = 10
        elif method == 'distilgpt2':
            api_url = f'{HF_API_URL}/distilbert/distilgpt2'
            prompt = f"Respond briefly to: {transcript}\nResponse: "
            max_length = 50
        else:
            return jsonify({'error': f'Unsupported generate method: {method}'}), 400
        
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {"inputs": prompt, "parameters": {"max_length": max_length, "no_repeat_ngram_size": 2}}
        
        # Thử gọi API vài lần nếu lỗi 503 (lỗi tạm thời từ phía API)
        for attempt in range(2):
            response = requests.post(api_url, headers=headers, json=payload)
            if response.status_code == 200:
                break
            print(f'Attempt {attempt + 1} - Hugging Face API error: {response.text}')
            if response.status_code != 503:
                break
            time.sleep(1) # Chờ 1 giây trước khi thử lại
        
        if response.status_code != 200:
            print(f'Hugging Face API error: {response.text}')
            return jsonify({'error': 'Failed to generate response'}), 500
        
        raw_response = response.json()
        print(f'Raw API response: {json.dumps(raw_response)}')
        
        generated_text = raw_response[0].get('generated_text','').strip()
        if not generated_text:
            print('Warning: No generated text returned')
            generated_text = "Sorry, I couldn't generate a response"
        
        # Cắt prompt để lấy câu trả lời
        if generated_text.startswith(prompt):
            generated_text = generated_text[len(prompt):].strip()
        
        # Nếu không có nội dung sau khi cắt, dùng fallback
        if not generated_text:
            generated_text = "I don't know what to say!"
            
        print(f'{method.capitalize()} response: {generated_text}')
        return jsonify({'response': generated_text})
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': str(e)}), 500

# Text to speech
@app.route('/tts', methods=['POST'])
def tts():
    try:
        data = request.get_json()
        text = data.get('text','')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Lấy method từ query string, mặc định là gtts
        method = request.args.get('method', 'gtts')
        
        timestamp = int(time.time() * 1000)
        audio_filename = f"output_{timestamp}.mp3"
        audio_path = os.path.join(CACHE_DIR, audio_filename)
        wav_path = os.path.join(CACHE_DIR, f"output_{timestamp}.wav") # Piper tạo wav trước
        
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
                return jsonify({'error': 'Failed to generate audio with Piper'}), 500
            
            # Convert WAV sang MP3
            stream = ffmpeg.input(wav_path)
            stream = ffmpeg.output(stream, audio_path, acodec='mp3')
            ffmpeg.run(stream, quiet=True)
            os.remove(wav_path)
            print(f'Generated audio with Piper: {audio_path}')
        else:
            return jsonify({'error': f'Unsupported TTS method: {method}'}), 400
        
        # Kiểm tra file tồn tại
        if not os.path.exists(audio_path):
            return jsonify({'error': 'Audio file not generated'}), 500
        
        # Gửi file audio và thêm header chứa filename
        response = send_file(audio_path, mimetype="audio/mp3")
        response.headers['X-Audio-Filename'] = audio_filename
        print(f'Sending X-Audio-Filename: {audio_filename}')
        return response
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': str(e)}), 500

# Phát lại audio
@app.route('/audio/<filename>', methods=['GET'])
def get_audio(filename):
    audio_path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype="audio/mp3")
    return jsonify({'error': 'Audio not found'}), 404

if __name__ == '__main__':
    clean_cache()
    app.run(host='0.0.0.0', port=3000, debug=True)