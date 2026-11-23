from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Hugging Face
    # Sin token la app funciona con la estimación por reglas. El modelo debe estar servido por un proveedor de Inference Providers
    # (lista: https://router.huggingface.co/v1/models); Qwen2.5-7B-Instruct, el modelo original, ya no lo sirve ninguno.
    huggingface_api_token: str = ""
    huggingface_model: str = "meta-llama/Llama-3.3-70B-Instruct"

    # Database
    mariadb_host: str = "localhost"
    mariadb_port: int = 3306
    mariadb_database: str = "seismic_db"
    mariadb_user: str = "seismic_user"
    mariadb_password: str

    # USGS API
    usgs_api_url: str = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    polling_interval_seconds: int = 180

    # FastAPI
    fastapi_host: str = "0.0.0.0"
    fastapi_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Escribir en el log cada consulta SQL (solo para depurar; hace mucho ruido)
    sql_echo: bool = False

    # Seismic calculation constants
    min_magnitude_threshold: float = 4.5  # Minimum magnitude to process
    max_depth_km: float = 700.0

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def database_url(self) -> str:
        return f"mysql+aiomysql://{self.mariadb_user}:{self.mariadb_password}@{self.mariadb_host}:{self.mariadb_port}/{self.mariadb_database}"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
