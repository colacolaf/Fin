import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    fin_env: str = "local"
    data_dir: str = "./data"
    db_path: str = "./data/fin.db"
    jwt_secret: str = ""
    auth_enabled: bool = False
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b"
    alpaca_api_key: str = ""
    alpaca_api_secret: str = ""
    cors_origins: str = "http://localhost:3000,http://localhost:5173"


settings = Settings()

# Ensure JWT secret is set for production
if not settings.jwt_secret:
    if os.environ.get("FIN_ENV", settings.fin_env) == "production":
        raise ValueError("JWT_SECRET must be set in production")
    settings.jwt_secret = "dev-secret-change-in-production"
