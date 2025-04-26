import sys
import os
'''Xử lý lỗi cgi do httpx, sau này thử hạ xuống py 3.12 rồi bỏ đi test lại'''
# import types

# Tạo module cgi giả
# fake_cgi = types.ModuleType("cgi")
# def parse_header(line):
#     if not isinstance(line, str):
#         line = line.decode('utf-8')
#     if ':' not in line:
#         return line, {}
#     main_value, rest = line.split(':', 1)
#     main_value = main_value.strip()
#     rest = rest.strip()
#     if ';' not in rest:
#         return main_value, {}
#     params = {}
#     for param in rest.split(';')[1:]:
#         if '=' in param:
#             key, value = param.split('=', 1)
#             params[key.strip()] = value.strip()
#         else:
#             params[param.strip()] = ''
#     return main_value, params

# fake_cgi.parse_header = parse_header
# sys.modules["cgi"] = fake_cgi  # Gắn module giả vào sys.modules

'''Xóa khúc trên'''
# Thêm thư mục backend vào sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load biến môi trường trước khi import các module khác
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from typing import AsyncIterator
from contextlib import asynccontextmanager

from .config.app_config import configure_app
from .logging_config import logger
from .storage.minio_client import MinioClient
from .services.cache_service import CacheService
from .scheduler.scheduler_config import configure_scheduler
from .utils import CACHE_DIR

app = FastAPI(redirect_slashes=False)

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

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan event handler for FastAPI."""
    # Startup logic
    logger.info("Application started")
    cache_service.clean_cache()  # Dọn cache khi khởi động
    yield
    # Shutdown logic
    logger.info("Application shutdown")
    scheduler.shutdown()

# Gán lifespan handler cho app
app.router.lifespan_context = lifespan
    
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)