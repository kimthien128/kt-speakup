from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from database import db

router = APIRouter(prefix="/auth", tags=["auth"])

# Cấu hình JWT
SECRET_KEY = "kimthien-secret-key" # Sẽ thay key mạnh hơn trong production và lưu vào env
ALGORITHM = "HS256" # thuật toán mã hóa HMAC với SHA-256
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token sẽ hết hạn sau 30 phút

# Hash mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Model cho request
class UserCreate(BaseModel):
    email: str
    password: str

# Model cho dữ liệu trong DB
class UserInDB(BaseModel):
    email: str
    hashed_password: str
    id: str = None # Thêm _id (chuỗi) để khớp với MongoDB sau khi convert
    
# Hàm hỗ trợ
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Error hashing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to hash password")

# Hàm tạo token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Hàm lấy user hiện tại từ token và gia hạn nếu cần
async def get_current_user(token: str = Depends(oauth2_scheme), response: Response = None):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = await db.users.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Tạo instance UserInDB
        user_in_db = UserInDB(email=user["email"], hashed_password=user["hashed_password"], id=str(user["_id"]))
        
        # Kiểm tra thời gian hết hạn và gia hạn nếu cần
        exp = payload.get('exp')
        if exp:
            expire_time = datetime.utcfromtimestamp(exp)
            remaining_time = (expire_time - datetime.utcnow()).total_seconds()
            if remaining_time < 300: # Còn dưới 5 phút = 300s
                new_token = create_access_token(
                    data={"sub": email},
                    expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                )
                print(f"Renewed token for {email}: {new_token}")
                if response: # Thêm new_token vào header nếu response có sẵn
                    response.headers["X-New-Token"] = new_token
        return user_in_db
    except JWTError:
        raise credentials_exception
    
# Đăng ký
@router.post("/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="email already registered")
    hashed_password = get_password_hash(user.password)
    user_dict = {"email": user.email, "hashed_password": hashed_password}
    result = await db.users.insert_one(user_dict)
    return {"message": "User registered successfully"}

# Đăng nhập
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Lấy thông tin user hiện tại
@router.get("/me")
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    # Trả về dict với email từ UserInDB
    return {"email": current_user.email}