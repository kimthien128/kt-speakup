# config/jwt_config.py
# Xử lý cấu hình JWT và các hàm liên quan (hash mật khẩu, tạo token, v.v.).
# Tuân thủ SRP: Chỉ xử lý logic liên quan đến JWT và xác thực.

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from ..utils import JWT_SECRET_KEY
from ..logging_config import logger

# Cấu hình cho JWT
class JWTConfig:
    def __init__(self):
        self.secret_key = JWT_SECRET_KEY
        self.algorithm = "HS256"  # thuật toán mã hóa HMAC với SHA-256
        self.access_token_expire_minutes = 360  # Token hết hạn sau 360 phút (6 tiếng)

# Hàm để lấy cấu hình JWT
def get_jwt_config():
    return JWTConfig()

# Hash mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác thực mật khẩu bằng cách so sánh mật khẩu đã hash với mật khẩu người dùng nhập vào."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash mật khẩu người dùng nhập vào."""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to hash password")
    
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Tạo token truy cập với dữ liệu người dùng và thời gian hết hạn."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_jwt_config.secret_key, algorithm=get_jwt_config.algorithm)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Giải mã token và trả về dữ liệu bên trong."""
    try:
        payload = jwt.decode(token, get_jwt_config.secret_key, algorithms=get_jwt_config.algorithm)
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )