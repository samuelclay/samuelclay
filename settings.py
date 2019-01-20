# Django settings for samuelclay project.
import os
import sys
import logging

logging.basicConfig(
    level = logging.DEBUG,
    format = " %(levelname)s %(name)s: %(message)s",
)

ROOT_PATH = os.path.dirname(os.path.abspath(__file__))
here = lambda x: os.path.join(os.path.abspath(os.path.dirname(__file__)), x)
sys.path.append(here('vendor'))
sys.path.append(here('vendor/tagging'))
sys.path.append(here('vendor/tweepy'))

DEBUG = True
TEMPLATE_DEBUG = True

ADMINS = (
    ('Samuel Clay', 'samuel@ofbrooklyn.com'),
)

INTERNAL_IPS = ('127.0.0.1', '*')

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'clay.db',
    }
}

# DATABASE_ENGINE = 'django.db.backends.sqlite3'           # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
# DATABASE_NAME = 'clay.db'             # Or path to database file if using sqlite3.
# DATABASE_USER = ''             # Not used with sqlite3.
# DATABASE_PASSWORD = ''         # Not used with sqlite3.
# DATABASE_HOST = ''             # Set to empty string for localhost. Not used with sqlite3.
# DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.
# CACHE_BACKEND = 'dummy://'
# CACHE_BACKEND = 'localmem://'
# CACHE_BACKEND = 'memcached://127.0.0.1:35098'
CACHE_BACKEND = "db://cache"

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache',
    }
}
# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/New_York'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = False

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = here('media')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/static/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

APPEND_SLASH = True

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'v^p3t7s&oj=-*-@szb(y)-@7g@%$^7mni3o@+b_e*(qy)h3ls='

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = [
'django.template.loaders.filesystem.Loader',
'django.template.loaders.app_directories.Loader',      
]

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.debug',
    'django.core.context_processors.media',
    'django.contrib.auth.context_processors.auth',
)

CACHE_MIDDLEWARE_SECONDS = 600

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    here('templates'),
    here('portfolio'),
    here('bikes'),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'com',
    'syncr.flickr',
    'tagging',
)

from local_settings import *
