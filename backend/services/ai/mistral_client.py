# services/ai/mistral_client.py
# Triển khai AIClient cho Mistral.
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến Mistral.

from llama_cpp import Llama
from .ai_client import AIClient

class MistralClient(AIClient):
    def __init__(self):
        self.llm = Llama(
            model_path="backend/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
            n_ctx=4096, # Độ dài ngữ cảnh tối đa
            n_gpu_layers=0,  # Offload sang GPU nếu có CUDA, nếu không thì 0
            chat_format="mistral-instruct", # Chỉ định định dạng chat của Mistral
            verbose=True
        )
        
    def generate_response(self, messages: list) -> str:
        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=30,
            temperature=0.7
        )
        return response["choices"][0]["message"]["content"].strip()
    
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        messages = [
            {"role": "system", "content": "You are a translator. Provide accurate translations in a natural tone."},
            {"role": "user", "content": f"Translate the following {source_lang} text to {target_lang}: {text}"}
        ]
        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=100,  # Tăng giới hạn token cho dịch
            temperature=0.3  # Giảm temperature để dịch chính xác hơn
        )
        return response["choices"][0]["message"]["content"].strip()