from fastapi import APIRouter, Request, HTTPException, Depends
from llama_cpp import Llama
from utils import OPENAI_API_KEY, GOOGLE_API_KEY
from routes.auth import UserInDB, get_current_user
from database import db
from bson import ObjectId
import requests
import google.generativeai as genai

router = APIRouter()

# Khởi tạo mô hình Mistral-7B GGUF một lần khi khởi động
MODEL_PATH = "backend/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096, # Độ dài ngữ cảnh tối đa
    n_gpu_layers=0,  # Offload sang GPU nếu có CUDA, nếu không thì 0
    chat_format="mistral-instruct", # Chỉ định định dạng chat của Mistral
    verbose=True
)

#Cấu hình OpenAI
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

#Cấu hình Gemini API
genai.configure(api_key=GOOGLE_API_KEY)
# Khởi tạo model một lần để dùng cho tất cả các request
model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config=genai.types.GenerationConfig(
        max_output_tokens=20, # Giới hạn token (~1 câu ngắn)
        temperature=0.7 # Điều chỉnh độ sáng tạo
    )
    )

@router.post('')
async def generate(request: Request, current_user: UserInDB = Depends(get_current_user)):
    try:
        data = await request.json()
        transcript = data.get('transcript', '')
        chat_id = data.get('chat_id', '') # Lấy chat_id từ request để truy xuất history
        print(f'Received request - transcript: "{transcript}", chat_id: "{chat_id}"')
        
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
        if not chat_id:
            raise HTTPException(status_code=400, detail="No chat_id provided")
        
        # Kiểm tra chat_id hợp lệ và lấy lịch sử từ MongoDB
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": current_user.id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Lấy method từ query parameter
        method = request.query_params.get('method', 'gemini')
        
        # Chọn URL API dựa trên method
        if method == 'chatgpt':
            history = chat.get('history', [])
            messages = [
                {"role": "system", "content": "You are a chatbot assisting in learning English. Reply with one short sentence."}
            ]
            for msg in history:
                messages.append({"role": "user", "content": msg["user"]})
                if msg.get("ai"):
                    messages.append({"role": "assistant", "content": msg["ai"]})
            messages.append({"role":"user", "content":transcript})
            print(f'ChatGPT messages: {messages}')
            
            # Gọi OpenAI API
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": messages,
                "max_tokens": 20,
                "temperature": 0.7
            }
            response = requests.post(OPENAI_API_URL, headers=headers, json=payload)
            if response.status_code != 200:
                print(f"OpenAI API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="OpenAI API unavailable")
            
            result = response.json()
            generated_text = result["choices"][0]["message"]["content"].strip()
            
        elif method == 'mistral':
            history = chat.get('history', [])
            messages = [
                {"role": "system", "content": "You are a chatbot assisting in learning English. Reply with one short, complete sentence."}
            ]
            for msg in history:
                messages.append({"role": "user", "content": msg["user"]})
                if msg.get("ai"):
                    messages.append({"role": "assistant", "content": msg["ai"]})
            messages.append({"role": "user", "content": transcript})
            print(f'Mistral messages: {messages}')
            
            # Gọi Mistral-7B GGUF
            response = llm.create_chat_completion(
                messages=messages,
                max_tokens=20,
                temperature=0.7
            )
            generated_text = response["choices"][0]["message"]["content"].strip()
                
        elif method == 'gemini':
            # Lấy lịch sử chat từ MongoDB và chuyển thành định dạng glm.Content
            history = chat.get('history', [])
            chat_history = [
                # Thêm tin nhắn "system" giả lập vào đầu lịch sử
                {"role": "user", "parts": [{"text": "You are a chatbot assisting me in learning English. Reply with one short, complete sentence."}]},
                {"role": "model", "parts": [{"text": "Understood, I'll keep my responses short!"}]}
            ]
            for msg in history:
                chat_history.append({"role": "user", "parts": [{"text": msg["user"]}]})
                if msg.get("ai"):
                    chat_history.append({"role": "model", "parts": [{"text": msg["ai"]}]})
            print(f'Chat history loaded: {chat_history}')
            
            # Khởi tạo ChatSession với lịch sử
            chat_session = model.start_chat(
                history=chat_history
                )
            
            # Gửi tin nhắn mới và lấy phản hồi
            response = chat_session.send_message(transcript)
            generated_text = response.text.strip()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported generate method: {method}")
        
        # Fallback nếu không có nội dung
        if not generated_text:
            generated_text = "I don't know what to say!"
            
        print(f'{method.capitalize()} response: {generated_text}')
        return {'response': generated_text}
    except HTTPException as e:
        raise e
    except genai.types.generation_types.BrokenResponseError as e:
        print(f'Model API error: {e}')
        raise HTTPException(status_code=400, detail=f"Model API error: {str(e)}")
    except Exception as e:
        print(f'Error: {e}')
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")