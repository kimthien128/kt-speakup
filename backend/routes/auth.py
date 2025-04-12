from fastapi import APIRouter, HTTPException, Depends, Response, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from database import db
from utils import JWT_SECRET_KEY, minio_client, AVATARS_BUCKET, MINIO_ENDPOINT
from minio.error import S3Error
import uuid
import os
import io

router = APIRouter(prefix="/auth", tags=["auth"])

# Cấu hình JWT
SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = "HS256" # thuật toán mã hóa HMAC với SHA-256
ACCESS_TOKEN_EXPIRE_MINUTES = 360 # Token hết hạn sau 360 phút (6 tiếng)

# Kiểm tra bucket tồn tại, nếu không thì tạo
try:
    if not minio_client.bucket_exists(AVATARS_BUCKET):
        minio_client.make_bucket(AVATARS_BUCKET)
except S3Error as e:
    print(f"Error checking/creating bucket: {e}")
    raise HTTPException(status_code=500, detail="Failed to initialize MinIO bucket")

# Hash mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Model cho request
class UserCreate(BaseModel):
    email: str
    password: str
    avatarPath: str | None = None
    displayName: str | None = None
    phoneNumber: str | None = None
    gender: str | None = None
    location: str | None = None
    isAdmin: bool = False

# Model cho request đổi mật khẩu
class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str

# Model cho dữ liệu trong DB
class UserInDB(BaseModel):
    email: str
    hashed_password: str
    avatarPath: str | None
    displayName: str | None
    phoneNumber: str | None
    gender: str | None
    location: str | None
    isAdmin: bool
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
        user_in_db = UserInDB(
            email=user["email"], 
            hashed_password=user["hashed_password"], 
            avatarPath=user.get("avatarPath"),
            displayName=user.get("displayName"),
            phoneNumber=user.get("phoneNumber"),
            gender=user.get("gender"),
            location=user.get("location"),
            isAdmin=user.get("isAdmin", False),
            id=str(user["_id"])
            )
        
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
    user_dict = {
        "email": user.email, 
        "hashed_password": hashed_password,
        "avatarPath": user.avatarPath,
        "displayName": user.displayName,
        "phoneNumber": user.phoneNumber,
        "gender":user.gender,
        "location": user.location,
        "isAdmin": user.isAdmin
        }
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
    return {
        "email": current_user.email,
        "avatarPath": current_user.avatarPath,
        "displayName": current_user.displayName,
        "phoneNumber": current_user.phoneNumber,
        "gender": current_user.gender,
        "location": current_user.location,
        "isAdmin": current_user.isAdmin
        }

# Cập nhật thông tin user
@router.patch("/update")
async def update_user(
    displayName: str = Form(...), 
    phoneNumber: str = Form(None),
    gender: str = Form(None),
    location: str = Form(None),
    avatar: UploadFile = File(None), 
    current_user: UserInDB = Depends(get_current_user)
):
    update_data = {
        "displayName": displayName,
        "phoneNumber": phoneNumber,
        "gender":gender,
        "location": location
        }
    old_avatar_path = current_user.avatarPath # Lưu avatarPath cũ để xóa sau
    
    # Xử lý upload avatar
    if avatar:
        # Validate file
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
        file_extension = os.path.splitext(avatar.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Only image files (jpg, jpeg, png, gif) are allowed")
        
        # Kiểm tra kích thước file (giới hạn 2MB)
        content = await avatar.read()
        if len(content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size should be less than 2MB")
        
        # Tạo tên file duy nhất
        file_name = f"{uuid.uuid4()}{file_extension}"
        try:
            # Chuyển content thành file-like object
            file_like = io.BytesIO(content)
            # Upload file lên MinIO
            minio_client.put_object(
                bucket_name=AVATARS_BUCKET,
                object_name=file_name,
                data=file_like,
                length=len(content),
                content_type=avatar.content_type
            )
            # Tạo URL cho avatar
            avatar_url = f"http://{MINIO_ENDPOINT}/{AVATARS_BUCKET}/{file_name}"
            update_data["avatarPath"] = avatar_url
        except S3Error as e:
            print(f"Error uploading to MinIO: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload avatar to MinIO")
        finally:
            await avatar.close()
            
        # Xóa avatar cũ nếu có
        if old_avatar_path:
            try:
                # Trích xuất tên file từ URL
                old_file_name = old_avatar_path.split("/")[-1]
                minio_client.remove_object(AVATARS_BUCKET, old_file_name)
                print(f"Deleted old avatar: {old_file_name}")
            except S3Error as e:
                print(f"Error deleting old avatar: {e}")
                # Không ném lỗi, chỉ log vì file mới đã upload thành công
        
    # Cập nhật thông tin user trong MongoDB
    try:
        # Loại bỏ các trường None khỏi update_data
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": update_data}
        )
    except Exception as e:
        print(f"Error updating user in DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user in database")

    # Lấy thông tin user đã cập nhật
    updated_user = await db.users.find_one({"email": current_user.email})
    return {
        "email": updated_user["email"],
        "displayName": updated_user["displayName"],
        "phoneNumber": updated_user.get("phoneNumber"),
        "gender": updated_user.get("gender"),
        "location": updated_user.get("location"),
        "avatarPath": updated_user.get("avatarPath"),
        "isAdmin": updated_user.get("isAdmin", False)
    }
    
# Đổi mật khẩu
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    # Kiểm tra mật khẩu cũ
    if not verify_password(request.oldPassword, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    
    # Kiểm tra mật khẩu mới
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Hash mật khẩu mới
    new_hashed_password = get_password_hash(request.newPassword)
    
    # Cập nhật mật khẩu trong MongoDB
    try:
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": {"hashed_password": new_hashed_password}}
        )
    except Exception as e:
        print(f"Error updating password in DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to update password in database")
    return {"message": "Password updated successfully"}