# backend/logging_config.py

import logging
import os
from datetime import datetime

def setup_logging():
    # Tạo logger chính
    logger = logging.getLogger("app")
    logger.setLevel(logging.DEBUG) # Mức độ thấp nhất để ghi log
    
    # Tạo formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Tạo console handler (hiển thị log trên console)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO) # Chỉ hiển thị log từ mức INFO trở lên
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Tạo file handler (ghi log vào file) : tạm thời không sử dụng
    
    return logger

# Khởi tạo logger khi ứng dụng khởi động
logger = setup_logging()