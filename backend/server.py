'''Xử lý lỗi cgi do httpx, sau này thử hạ xuống py 3.12 rồi bỏ đi test lại'''
import sys
import types

# Tạo module cgi giả
fake_cgi = types.ModuleType("cgi")
def parse_header(line):
    if not isinstance(line, str):
        line = line.decode('utf-8')
    if ':' not in line:
        return line, {}
    main_value, rest = line.split(':', 1)
    main_value = main_value.strip()
    rest = rest.strip()
    if ';' not in rest:
        return main_value, {}
    params = {}
    for param in rest.split(';')[1:]:
        if '=' in param:
            key, value = param.split('=', 1)
            params[key.strip()] = value.strip()
        else:
            params[param.strip()] = ''
    return main_value, params

fake_cgi.parse_header = parse_header
sys.modules["cgi"] = fake_cgi  # Gắn module giả vào sys.modules

'''Xóa khúc trên'''

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
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
    expose_headers=['X-Audio-Url', 'X-New-Token'],
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
from routes.auth import router as auth_router
from routes.translate import router as translate_router
from routes.config import router as config_router
from utils import clean_cache, CACHE_DIR

# Thư mục cache nếu chưa có
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Đăng ký các route
app.include_router(auth_router)
app.include_router(stt_router, prefix='/stt')
app.include_router(generate_router, prefix='/generate')
app.include_router(tts_router, prefix='/tts')
app.include_router(audio_router, prefix='/audio')
app.include_router(word_info_router, prefix='/word-info')
app.include_router(vocab_router, prefix='/vocab')
app.include_router(translate_router, prefix='/translate')
app.include_router(config_router, prefix='/config')
app.include_router(chats_router)

# Chạy scheduler để dọn cache mỗi ngày
scheduler = BackgroundScheduler()
scheduler.add_job(clean_cache, 'interval', hours=24)
scheduler.start()

# Sự kiện khởi động
@app.on_event("startup")
async def startup_event():
    clean_cache()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
    
if __name__ == '__main__':
    # Test in ra giá trị
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)