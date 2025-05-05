#services/admin_initializer.py
#Khởi tạo tài khoản admin cho ứng dụng

import os
from ..logging_config import logger

async def initialize_admin(user_service):
    admin_email = os.getenv("ADMIN_DEFAULT_EMAIL")
    admin_password = os.getenv("ADMIN_DEFAULT_PASSWORD")

    if not admin_email or not admin_password:
        logger.error("ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD not set in .env")
        return
    
    try:
        # Kiểm tra xem tài khoản admin đã tồn tại chưa
        existing_user = await user_service.auth_repository.find_user_by_email(admin_email)
        if existing_user:
            logger.info(f"Admin account with email {admin_email} already exists")
            return

        # Tạo tài khoản admin mặc định
        admin_data = {
            "email": admin_email,
            "password": admin_password,
            "isAdmin": True,
            "status": "active",
        }
        created_user = await user_service.create_user_by_admin(admin_data)
        logger.info(f"Default admin account created successfully: {created_user['email']}")
    except Exception as e:
        logger.error(f"Failed to initialize admin account: {str(e)}")