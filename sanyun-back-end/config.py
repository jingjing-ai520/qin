import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """应用配置类"""
    # 数据库配置
    DB_USERNAME = os.getenv('DB_USERNAME', 'bosnds3')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'abc123')
    DB_HOSTNAME = os.getenv('DB_HOSTNAME', '49.235.20.50')
    DB_PORT = int(os.getenv('DB_PORT', 8853))
    DB_SERVICE_NAME = os.getenv('DB_SERVICE_NAME', 'orcl')
    
    # Flask配置
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    # CORS配置
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # API配置
    API_PREFIX = '/api'
    API_VERSION = 'v1' 