from vosk import Model, KaldiRecognizer
import wave
import json

model = Model("models/vosk-model-small-en-us-0.15")
rec = KaldiRecognizer(model, 16000) # 16000 Hz là sample rate

def recognize_audio(audio_file):
    wf = wave.open(audio_file, "rb")
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            return result.get("text", "")
    result= json.loads(rec.FinalResult())
    return result.get("text", "")

if __name__ == "__main__":
    text = recognize_audio("input.wav") # Test với file WAV
    print(text)