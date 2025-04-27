# backend/security.py
from fastapi import Depends, Response
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class UserInDB:
    def __init__(
        self,
        email: str,
        hashed_password: str, 
        avatarPath: str | None = None, 
        displayName: str | None = None, 
        phoneNumber: str | None = None, 
        gender: str | None = None, 
        location: str | None = None, 
        isAdmin: bool = False, 
        id: str = None,
        status: str = "pending",
        ):
        self.email = email
        self.hashed_password = hashed_password
        self.avatarPath = avatarPath
        self.displayName = displayName
        self.phoneNumber = phoneNumber
        self.gender = gender
        self.location = location
        self.isAdmin = isAdmin
        self.id = id
        self.status = status
        
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service = None,
    response: Response = None
) -> UserInDB:
    if auth_service is None:
        raise ValueError("AuthService must be provided")
    return await auth_service.get_current_user(token=token, response=response)