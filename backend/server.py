import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load biến môi trường trước khi import các module khác
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from typing import AsyncIterator
from contextlib import asynccontextmanager

from .config.app_config import configure_app
from .logging_config import logger
from .storage.minio_client import MinioClient
from .services.cache_service import CacheService
from .scheduler.scheduler_config import configure_scheduler
from .utils import CACHE_DIR, BASE_DIR
from .dependencies import DependencyContainer
from .services.user_service import UserService
from .services.admin_initializer import initialize_admin

app = FastAPI(redirect_slashes=False) # Không tự động chuyển hướng khi có dấu / ở cuối URL, kiểm soát nghiêm ngặt các route tự đặt

# Khởi tạo MinIO client và cache service
storage_client = MinioClient()
cache_service = CacheService(storage_client)

# Cấu hình Jinja2
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Thư mục cache nếu chưa có
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Cấu hình scheduler
scheduler = configure_scheduler(cache_service)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan event handler for FastAPI."""
    # Startup logic
    logger.info("Application started")
    cache_service.clean_cache()  # Dọn cache khi khởi động
    
    # Khởi tạo UserService và tạo tài khoản admin mặc định
    global user_service
    auth_repository = await DependencyContainer.get_auth_repository()  # Đảm bảo await trước
    user_service = UserService(auth_repository, storage_client)
    await initialize_admin(user_service)
    
    yield
    # Shutdown logic
    logger.info("Application shutdown")
    scheduler.shutdown()

# Gán lifespan handler cho app
app.router.lifespan_context = lifespan

# Cấu hình app (CORS, routers)
configure_app(app)
    
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)