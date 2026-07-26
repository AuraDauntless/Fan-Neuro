from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FanPlay IOT Fan Neuro"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # WebSocket Configuration
    WS_PATH: str = "/ws/neuro-stream"

settings = Settings()
