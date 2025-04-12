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
import os
from dotenv import load_dotenv
from config.app_config import configure_app
from storage.minio_client import MinioClient
from services.cache_service import CacheService
from scheduler.scheduler_config import configure_scheduler
from utils import CACHE_DIR

app = FastAPI()

# Load biến môi trường
load_dotenv()

# Khởi tạo MinIO client và cache service
storage_client = MinioClient()
cache_service = CacheService(storage_client)

# Thư mục cache nếu chưa có
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Cấu hình app (CORS, routers)
configure_app(app)

# Cấu hình scheduler
scheduler = configure_scheduler(cache_service)

# Sự kiện khởi động
@app.on_event("startup")
async def startup_event():
    cache_service.clean_cache()  # Dọn cache khi khởi động

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
    
if __name__ == '__main__':
    # Test in ra giá trị
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)