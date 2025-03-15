from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Chỉ cho phép Vite local truy cập
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=['X-Audio-Filename']
)
# Load biến môi trường
load_dotenv()
# Import sau khi load .env
from routes.stt import router as stt_router
from routes.generate import router as generate_router
from routes.tts import router as tts_router
from routes.audio import router as audio_router
from routes.word_info import router as word_info_router
from routes.vocab import router as vocab_router
from routes.chats import router as chats_router
from utils import clean_cache, CACHE_DIR, HF_API_URL

# Thư mục cache nếu chưa có
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Đăng ký các route
app.include_router(stt_router, prefix='/stt')
app.include_router(generate_router, prefix='/generate')
app.include_router(tts_router, prefix='/tts')
app.include_router(audio_router, prefix='/audio')
app.include_router(word_info_router, prefix='/word-info')
app.include_router(vocab_router, prefix='/add-vocab')
app.include_router(chats_router)

# Sự kiện khởi động
@app.on_event("startup")
async def startup_event():
    clean_cache()
    
if __name__ == '__main__':
    # Test in ra giá trị
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=3000)