from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/waybill"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"
    JWT_SECRET: str = "change-me-in-production"
    SENDGRID_KEY: str = ""
    TWILIO_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
