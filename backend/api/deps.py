from fastapi import Header, HTTPException, status

from config import get_settings

settings = get_settings()


def require_admin(x_admin_token: str = Header(default="")) -> None:
    if not x_admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的管理员凭证")
