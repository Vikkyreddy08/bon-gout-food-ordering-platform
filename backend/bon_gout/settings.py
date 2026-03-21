"""
Django settings for bon_gout project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load .env
load_dotenv()

# ==========================================
# BASE DIRECTORY
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================================
# SECURITY
# ==========================================
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if os.getenv('DEBUG', 'False') == 'True':
        SECRET_KEY = 'django-insecure-fallback-key-for-development-only'
    else:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured("SECRET_KEY cannot be empty in production.")

DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')

# Security settings for production (when DEBUG is False)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000 # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    # Render and Vercel handle HTTPS redirection at the edge/load balancer.
    # App-level redirect can cause CORS preflight (OPTIONS) failures.
    SECURE_SSL_REDIRECT = False 
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    # Looser security for local development
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# ==========================================
# ALLOWED HOSTS
# ==========================================
ALLOWED_HOSTS = [
    'localhost', 
    '127.0.0.1', 
    'foodordering-n21r.onrender.com',
    '.onrender.com',
    'bon-gout-food-ordering-platform.vercel.app',
    'bon-gout-food-ordering-platform-rolvk1sac.vercel.app',
    '.vercel.app' # Allow all Vercel subdomains
]

# Add environment-specific hosts
env_hosts_raw = os.getenv('ALLOWED_HOSTS')
if env_hosts_raw:
    # Clean up host entries: remove protocol and trim whitespace
    cleaned_hosts = [h.strip().replace('https://', '').replace('http://', '') for h in env_hosts_raw.split(',')]
    ALLOWED_HOSTS.extend(cleaned_hosts)

RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

if DEBUG:
    ALLOWED_HOSTS = ['*'] # Wide open for local dev

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = [
    'https://foodordering-n21r.onrender.com',
    'https://bon-gout-food-ordering-platform.vercel.app',
    'https://bon-gout-food-ordering-platform-rolvk1sac.vercel.app',
    'https://bon-gout-food-ordering-platform-git-main-vikkyreddy08s-projects.vercel.app',
]
if DEBUG:
    CSRF_TRUSTED_ORIGINS += [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ]

# ==========================================
# APPLICATIONS
# ==========================================
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # Added for whitenoise
    'django.contrib.staticfiles',

    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

    # Your apps
    'users',
    'restaurant',
]

# ==========================================
# MIDDLEWARE
# ==========================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ==========================================
# ROOT
# ==========================================
ROOT_URLCONF = 'bon_gout.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bon_gout.wsgi.application'

# ==========================================
# DATABASE - Aiven MySQL
# ==========================================
DB_SSL_MODE = os.getenv('DB_SSL_MODE', 'REQUIRED')
DB_CA_PATH = os.getenv('DB_SSL_CA_PATH', str(BASE_DIR / 'bon_gout' / 'ssl' / 'ca.pem'))

# Determine SSL options based on environment
db_ssl_options = {}
if os.path.exists(DB_CA_PATH):
    # We are likely on Render or local with CA file
    db_ssl_options = {'ca': DB_CA_PATH}
elif not DEBUG:
    # Production but CA file missing? Use mode
    db_ssl_options = {'ssl_mode': DB_SSL_MODE}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'defaultdb'),
        'USER': os.getenv('DB_USER', 'avnadmin'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'CONN_MAX_AGE': 600, # 10 minutes - Keeps DB connections alive longer
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
            'connect_timeout': 30, # Increase timeout for DB connection
        },
    }
}

if db_ssl_options:
    DATABASES['default']['OPTIONS']['ssl'] = db_ssl_options

# Fallback to SQLite if MySQL configuration is missing or invalid in local dev
if DEBUG and not os.getenv('DB_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ==========================================
# PASSWORD VALIDATION
# ==========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ==========================================
# AUTH CONFIG
# ==========================================
AUTH_USER_MODEL = 'users.User'

# ==========================================
# REST FRAMEWORK
# ==========================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # admin access
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

# ==========================================
# SIMPLE JWT
# ==========================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
}

# ==========================================
# CORS
# ==========================================
CORS_ALLOW_ALL_ORIGINS = True # Set to True for deployment debugging to rule out CORS issues
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# Even though we allow all origins, we keep these for CSRF safety
CSRF_TRUSTED_ORIGINS = [
    'https://foodordering-n21r.onrender.com',
    'https://bon-gout-food-ordering-platform.vercel.app',
    'https://bon-gout-food-ordering-platform-rolvk1sac.vercel.app',
    'https://bon-gout-food-ordering-platform-git-main-vikkyreddy08s-projects.vercel.app',
]

# Allow any subdomain of vercel.app for development flexibility
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://bon-gout-food-ordering-platform.*\.vercel\.app$",
]

# ==========================================
# MEDIA
# ==========================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ==========================================
# STATIC
# ==========================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

if not DEBUG:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }

# ==========================================
# EMAIL
# ==========================================
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER or 'webmaster@localhost'

# ==========================================
# RAZORPAY
# ==========================================
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')

# ==========================================
# DEFAULT AUTO FIELD
# ==========================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================================
# LOGGING
# ==========================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}', 'style': '{'},
    },
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {'django': {'handlers': ['console'], 'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'), 'propagate': False}},
}# Make sure virtualenv is active
