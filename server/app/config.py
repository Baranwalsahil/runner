from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(..., alias="DATABASE_URL")
    database_url_direct: str | None = Field(default=None, alias="DATABASE_URL_DIRECT")
    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., alias="SUPABASE_ANON_KEY")
    supabase_jwt_secret: str = Field(..., alias="SUPABASE_JWT_SECRET")

    redis_url: str | None = Field(default=None, alias="REDIS_URL")
    frontend_url: str | None = Field(default=None, alias="FRONTEND_URL")

    port: int = Field(default=8000, alias="PORT")
    h3_resolution: int = Field(default=9, alias="H3_RESOLUTION")
    node_env: str = Field(default="development", alias="NODE_ENV")
    version: str = Field(default="0.1.0", alias="VERSION")


@lru_cache
def get_settings() -> Settings:
    return Settings()
