from fastapi import APIRouter, Request
import requests
import torch
import json
import time
from transformers import AutoTokenizer, AutoModelForCausalLM
from utils import HF_API_KEY, HF_API_URL

router = APIRouter()

# tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
# model_distilgpt2 = AutoModelForCausalLM.from_pretrained("distilgpt2")

@router.post('')
async def generate(request: Request):
    try:
        data = await request.json()
        transcript = data.get('transcript', '')
        print('Received transcript:', transcript)
        if not transcript:
            return {'error':'No transcript provided'}, 400
        
        # Lấy method từ query parameter
        method = request.query_params.get('method', 'blenderbot')
        
        # Chọn URL API dựa trên method
        if method == 'blenderbot':
            if not HF_API_URL or not HF_API_KEY:
                print("Error: HF_API_URL or HF_API_KEY is not set")
                return {"error": "Server configuration error: Missing API credentials"}, 500
            
            api_url = f'{HF_API_URL}/facebook/blenderbot-400M-distill'
            prompt = f"Answer this question: {transcript}" # Thêm prompt để hướng dẫn AI trả lời liên quan đến transcript
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            payload = {"inputs": prompt, "parameters": {"max_length": 50}}
            
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
                return {'error': 'Failed to generate response'}, 500
            
            raw_response = response.json()
            print(f'Raw API response: {json.dumps(raw_response)}')
            
            generated_text = raw_response[0].get('generated_text','').strip()
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
                
        # elif method == 'distilgpt2':
        #     prompt = f"Respond briefly to: {transcript}\nResponse: "
        #     inputs = tokenizer(prompt, return_tensors="pt")
        #     with torch.no_grad():
        #         outputs = model_distilgpt2.generate(
        #             **inputs, 
        #             max_new_tokens=20, 
        #             no_repeat_ngram_size=2)
        #     generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        #     if generated_text.startswith(prompt):
        #         generated_text = generated_text[len(prompt):].strip()
        else:
            return {'error': f'Unsupported generate method: {method}'}, 400
        
        # Nếu không có nội dung sau khi cắt, dùng fallback
        if not generated_text:
            generated_text = "I don't know what to say!"
            
        print(f'{method.capitalize()} response: {generated_text}')
        return {'response': generated_text}
    except Exception as e:
        print(f'Error: {e}')
        return {'error': str(e)}, 500