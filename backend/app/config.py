from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://barth:barth123@localhost:5432/barth_db"
    SECRET_KEY: str = "barth-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    model_config = {"env_file": ".env"}

settings = Settings()
