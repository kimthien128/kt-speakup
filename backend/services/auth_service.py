# services/auth_service.py
# Xử lý logic nghiệp vụ liên quan đến xác thực: đăng ký, đăng nhập, cập nhật user, đổi mật khẩu.
# Gọi AuthRepository để thực hiện truy vấn dữ liệu.
# Tuân thủ SRP: Chỉ xử lý logic nghiệp vụ, không xử lý API hay truy vấn trực tiếp.

from fastapi import HTTPException, Response, UploadFile, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import uuid
import os
import io
import re
from jose import JWTError, jwt
from mailjet_rest import Client
from ..config.jwt_config import verify_password, get_password_hash
from ..logging_config import logger
from ..security import oauth2_scheme, UserInDB
        
class AuthService:
    def __init__(self, auth_repository, storage_client, jwt_config):
        self.auth_repository = auth_repository
        self.storage_client = storage_client
        self.jwt_config = jwt_config
        self.avatar_bucket = os.getenv("AVATARS_BUCKET")
        self.minio_endpoint = os.getenv("MINIO_ENDPOINT")
        # Khởi tạo Mailjet client
        self.mailjet_client = Client(auth=(os.getenv("MAILJET_API_KEY"), os.getenv("MAILJET_API_SECRET")), version='v3.1')
        
    async def get_current_user(self, token: str = Depends(oauth2_scheme), response: Response = None) -> UserInDB:
        # Giải mã token và lấy thông tin người dùng
        try:
            payload = jwt.decode(token, self.jwt_config.secret_key, algorithms=[self.jwt_config.algorithm])
            email : str = payload.get("sub")
            if email is None:
                raise HTTPException(status_code=401, detail="Invalid token")
        except JWTError:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await self.auth_repository.find_user_by_email(email)
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
            id=str(user["_id"]),
            status=user.get("status", "pending"),
            )
        
        # Kiểm tra thời gian hết hạn và gia hạn nếu cần
        exp = payload.get('exp')
        if exp:
            expire_time = datetime.utcfromtimestamp(exp)
            remaining_time = (expire_time - datetime.utcnow()).total_seconds()
            if remaining_time < 300: # Còn dưới 5 phút = 300s
                new_token = jwt.encode(
                    {"sub": email, "exp": datetime.utcnow() + timedelta(minutes=self.jwt_config.access_token_expire_minutes)},
                    self.jwt_config.secret_key,
                    algorithm=self.jwt_config.algorithm,
                )
                logger.info(f"Renewed token for {email}: {new_token}")
                if response: # Thêm new_token vào header nếu response có sẵn
                    response.headers["X-New-Token"] = new_token
        
        return user_in_db
    
    async def register(self, user_data: dict):
        """Đăng ký user mới"""
        existing_user = await self.auth_repository.find_user_by_email(user_data["email"])
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Kiểm tra mật khẩu nghiêm ngặt
        password_pattern = r"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
        if not re.match(password_pattern, user_data["password"]):
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter"
            )
        
        # Tạo token xác nhận
        confirmation_token = str(uuid.uuid4())
        token_expiry = datetime.utcnow() + timedelta(minutes=30)
        
        hashed_password = get_password_hash(user_data["password"])
        user_dict = {
            "email": user_data["email"],
            "hashed_password": hashed_password,
            "avatarPath": user_data.get("avatarPath"),
            "displayName": user_data.get("displayName"),
            "phoneNumber": user_data.get("phoneNumber"),
            "gender": user_data.get("gender"),
            "location": user_data.get("location"),
            "isAdmin": user_data.get("isAdmin", False),
            "status": "pending", # Trạng thái mặc định là pending
            "confirmation_token": confirmation_token, # Lưu token vào DB
            "confirmation_token_expiry": token_expiry, # Lưu thời gian hết hạn token
            "createdAt": datetime.utcnow(),
            }
        await self.auth_repository.create_user(user_dict)
        
        # Gửi email xác nhận
        await self.send_confirmation_email(user_data["email"], confirmation_token)
        
        return {
            "message": "User registered successfully",
            "confirmation_token": confirmation_token, # Trả về token để gửi qua email
            "createdAt": user_dict["createdAt"],
        }
    
    async def login(self, form_data: OAuth2PasswordRequestForm):
        """Đăng nhập và tạo access token"""
        user = await self.auth_repository.find_user_by_email(form_data.username)
        if not user or not verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Kiểm tra trạng thái tài khoản
        if user.get("status") != "active":
            raise HTTPException(status_code=403, detail="Account not activated. Please confirm your email.")
        
        access_token = jwt.encode(
            {"sub": user["email"], "exp": datetime.utcnow() + timedelta(minutes=self.jwt_config.access_token_expire_minutes)},
            self.jwt_config.secret_key,
            algorithm=self.jwt_config.algorithm
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    async def get_user_info(self, current_user: UserInDB):
        """Lấy thông tin user hiện tại"""
        user = await self.auth_repository.find_user_by_email(current_user.email)
        return {
            "email": current_user.email,
            "avatarPath": current_user.avatarPath,
            "displayName": current_user.displayName,
            "phoneNumber": current_user.phoneNumber,
            "gender": current_user.gender,
            "location": current_user.location,
            "isAdmin": current_user.isAdmin,
            "status": current_user.status,
            "createdAt": user.get("createdAt"),
        }
        
    async def update_user(self, displayName: str, phoneNumber: str, gender: str, location: str, avatar: UploadFile, current_user: UserInDB):
        """Cập nhật thông tin user"""
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
                self.storage_client.put_object(
                    bucket_name=self.avatar_bucket,
                    object_name=file_name,
                    data=file_like,
                    length=len(content),
                    content_type=avatar.content_type
                )
                # Tạo URL cho avatar
                # avatar_url = f"{self.minio_endpoint}/{self.avatar_bucket}/{file_name}"
                # Sử dụng presigned_get_object để tạo URL
                avatar_url = self.storage_client.presigned_get_object(self.avatar_bucket, file_name)
                update_data["avatarPath"] = avatar_url
            except Exception as e:
                logger.error(f"Error uploading to MinIO: {e}")
                raise HTTPException(status_code=500, detail="Failed to upload avatar to MinIO")
            finally:
                await avatar.close()
                
            # Xóa avatar cũ nếu có
            if old_avatar_path:
                try:
                    # Trích xuất tên file từ URL
                    old_file_name = old_avatar_path.split("/")[-1]
                    self.storage_client.remove_object(self.avatar_bucket, old_file_name)
                    logger.info(f"Deleted old avatar: {old_file_name}")
                except Exception as e:
                    logger.error(f"Error deleting old avatar: {e}")
                    # Không ném lỗi, chỉ log vì file mới đã upload thành công
            
        # Cập nhật thông tin user trong MongoDB
        # Loại bỏ các trường None khỏi update_data
        update_data = {k: v for k, v in update_data.items() if v is not None}
        await self.auth_repository.update_user(current_user.email, update_data)

        # Lấy thông tin user đã cập nhật
        updated_user = await self.auth_repository.find_user_by_email(current_user.email)
        return {
            "email": updated_user["email"],
            "displayName": updated_user["displayName"],
            "phoneNumber": updated_user.get("phoneNumber"),
            "gender": updated_user.get("gender"),
            "location": updated_user.get("location"),
            "avatarPath": updated_user.get("avatarPath"),
            "isAdmin": updated_user.get("isAdmin", False),
            "status": updated_user.get("status"),
            "createdAt": updated_user.get("createdAt"),
        }
    
    async def change_password(self, old_password: str, new_password: str, current_user: UserInDB):
        """Đổi mật khẩu"""
        # Kiểm tra mật khẩu cũ
        if not verify_password(old_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Old password is incorrect")
        
        # Kiểm tra mật khẩu mới
        password_pattern = r"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
        if not re.match(password_pattern, new_password):
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter"
            )
        
        # Hash mật khẩu mới
        new_hashed_password = get_password_hash(new_password)
        
        # Cập nhật mật khẩu trong database
        await self.auth_repository.update_user(
            current_user.email,
            {"hashed_password": new_hashed_password}
        )
        
        return {"message": "Password updated successfully"}
    
    async def confirm_email(self, email: str, token: str):
        """Xác nhận email và kích hoạt tài khoản"""
        user = await self.auth_repository.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Cập nhật trạng thái tài khoản thành "active"
        if user.get("status") == "active":
            raise HTTPException(status_code=400, detail="Account already activated")
        
        if user.get("confirmation_token") != token:
            raise HTTPException(status_code=400, detail="Invalid confirmation token")
        
        # Kiểm tra thời gian hết hạn
        expiry = user.get("confirmation_token_expiry")
        if expiry and datetime.utcnow() > expiry:
            raise HTTPException(status_code=400, detail="Confirmation token has expired")
        
        # Kích hoạt tài khoản và xóa token
        await self.auth_repository.update_user(email, {
            "status": "active",
            "confirmation_token": None, # Xóa token sau khi xác nhận
            "confirmation_token_expiry": None # Xóa thời gian hết hạn token
        })
        
        return {"message": "Account activated successfully"}
    
    async def send_confirmation_email(self, email: str, token: str):
        """Gửi email xác nhận"""
        app_url = os.getenv("APP_URL", "http://localhost:8000")
        confirm_url = f"{app_url}/auth/confirm?email={email}&token={token}"
        data = {
            'Messages': [
                {
                    'From': {
                        'Email': 'kimthien128@gmail.com',
                        'Name': "KT-SpeakUp"
                    },
                    'To': [
                        {
                            'Email': email,
                            'Name': email.split("@")[0]
                        }
                    ],
                    "Subject": "Confirm Your Registration - KT-SpeakUp",
                    "TextPart": "Thank you for registering with KT-SpeakUp! Please click the link below to confirm your account.",
                    "HTMLPart": f"""
                        <h3>Welcome to KT-SpeakUp!</h3>
                        <p>Thank you for registering. Please click the link below to confirm your account:</p>
                        <a href="{confirm_url}">Confirm Your Account</a>
                        <p>This link will expire in 30 minutes.</p>
                        <p>If you did not register, please ignore this email.</p>
                    """
                }
            ]
        }
        try:
            result = self.mailjet_client.send.create(data=data)
            if result.status_code != 200:
                logger.error(f"Failed to send confirmation email: {result.status_code} - {result.json()}")
                raise HTTPException(status_code=500, detail="Failed to send confirmation email")
            logger.info(f"Confirmation email sent to {email}")
        except Exception as e:
            logger.error(f"Error sending confirmation email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send confirmation email")
        
    async def forgot_password(self, email: str):
        """Xử lý yêu cầu quên mật khẩu"""
        user = await self.auth_repository.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Tạo token đặt lại mật khẩu
        reset_token = str(uuid.uuid4())
        token_expiry = datetime.utcnow() + timedelta(minutes=30)
        
        # Cập nhật token vào DB
        await self.auth_repository.update_user(email, {
            "reset_token": reset_token,
            "reset_token_expiry": token_expiry,
        })
        
        # Gửi email đặt lại mật khẩu
        await self.send_reset_password_email(email, reset_token)
        
        return {"message": "A password reset link has been sent to your email"}
    
    async def send_reset_password_email(self, email: str, token: str):
        """Gửi email đặt lại mật khẩu"""
        domain_url = os.getenv("DOMAIN_URL", "http://localhost:5173")
        reset_url = f"{domain_url}/reset-password?email={email}&token={token}"
        data = {
            'Messages': [
                {
                    'From': {
                        'Email': 'kimthien128@gmail.com',
                        'Name': "KT-SpeakUp"
                    },
                    'To': [
                        {
                            'Email': email,
                            'Name': email.split("@")[0]
                        }
                    ],
                    "Subject": "Reset Your Password - KT-SpeakUp",
                    "TextPart": "You requested to reset your password. Please click the link below to reset it.",
                    "HTMLPart": f"""
                        <h3>Password Reset Request</h3>
                        <p>You requested to reset your password. Please click the link below to reset it:</p>
                        <a href="{reset_url}">Reset Your Password</a>
                        <p>This link will expire in 30 minutes.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                    """
                }
            ]
        }
        try:
            result = self.mailjet_client.send.create(data=data)
            if result.status_code != 200:
                logger.error(f"Failed to send reset password email: {result.status_code} - {result.json()}")
                raise HTTPException(status_code=500, detail="Failed to send reset password email")
            logger.info(f"Reset password email sent to {email}")
        except Exception as e:
            logger.error(f"Error sending reset password email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send reset password email")
    
    async def reset_password(self, email: str, token: str, new_password: str):
        """Xử lý đặt lại mật khẩu"""
        user = await self.auth_repository.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Kiểm tra token
        if user.get("reset_token") != token:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Kiểm tra thời gian hết hạn
        expiry = user.get("reset_token_expiry")
        if expiry and datetime.utcnow() > expiry:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Kiểm tra mật khẩu mới
        password_pattern = r"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
        if not re.match(password_pattern, new_password):
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter"
            )
        
        # Hash mật khẩu mới
        new_hashed_password = get_password_hash(new_password)
        
        # Cập nhật mật khẩu và xóa token trong DB
        await self.auth_repository.update_user(email, {
            "hashed_password": new_hashed_password,
            "reset_token": None,
            "reset_token_expiry": None,
        })
        
        return {"message": "Password reset successfully"}