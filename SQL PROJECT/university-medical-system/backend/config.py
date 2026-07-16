import os
from datetime import timedelta

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'umc-super-secret-key-change-in-production-2025')
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'

    # Database
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'Root@123456!')
    DB_NAME = os.environ.get('DB_NAME', 'university_medical_db')

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'umc-jwt-secret-key-2025')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    PDF_FOLDER = os.path.join(os.path.dirname(__file__), 'pdfs')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000','http://192.168.0.192:3000']
