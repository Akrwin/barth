from pydantic_settings import BaseSettings


def _normalize_db_url(url: str) -> str:
    """Ensure URL uses postgresql+psycopg:// driver prefix (works with psycopg v3).
    Neon and Railway may provide postgres:// or postgresql:// — this normalises both."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://barth:barth123@localhost:5432/barth_db"
    SECRET_KEY: str = "barth-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def db_url(self) -> str:
        return _normalize_db_url(self.DATABASE_URL)

    model_config = {"env_file": ".env"}


settings = Settings()
