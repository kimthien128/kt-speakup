from flask import Flask, request, jsonify
from flask_cors import CORS
from vosk import Model, KaldiRecognizer
import ffmpeg
import wave
import json
import os
import time

app = Flask(__name__)
CORS(app, resources={r"/stt":{"origins":"http://localhost:5173"}}) # Chỉ cho phép Vite local

model = Model("backend/models/vosk-model-small-en-us-0.15")
rec = KaldiRecognizer(model, 16000)

@app.route('/stt', methods=['POST'])
def stt():
    try:
        # Nhận audioBlob (WebM) từ frontend
        audio_blob = request.get_data()
        print(f"Received audio size: {len(audio_blob)} bytes")
        if not audio_blob:
            return jsonify({'error': 'No audio data received'}), 400
        
        # Tạo tên file duy nhất với timestamp
        timestamp = int(time.time() * 1000)  # Miliseconds
        webm_path = f"backend/input_{timestamp}.webm"
        wav_path = f"backend/input_{timestamp}.wav"
        with open(webm_path, 'wb') as f:
            f.write(audio_blob)
            
        # Convert WebM sang WAV bằng ffmpeg-python
        try:
            stream = ffmpeg.input(webm_path)
            stream = ffmpeg.output(stream, wav_path, ar=16000, ac=1, format='wav')
            ffmpeg.run(stream)
            print("Converted to WAV")
        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return jsonify({'error': 'Failed to convert audio'}), 500
        
        # Vosk xử lý WAV, Dùng with để mở file WAV, trả transcript trước khi xóa
        transcript = ''
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
        
        # Thêm delay nhỏ và xử lý lỗi xóa file
        time.sleep(0.1)  # Chờ 0.1 giây để Windows giải phóng file
        
        # Xóa file sau khi xử lý
        try:
            os.remove(webm_path)
            os.remove(wav_path)
        except OSError as e:
            print(f"Warning: Could not delete files - {e}")
            
        return jsonify({'transcript': transcript})
    
    except Exception as e:
        print(f'Error: {e}')
        if os.path.exists(webm_path):
            try:
                os.remove(webm_path)
            except OSError:
                pass
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except OSError:
                pass
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)