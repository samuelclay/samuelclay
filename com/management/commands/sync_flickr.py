import os
import logging
import datetime
import errno
from optparse import make_option
from django.core.management.base import BaseCommand
from django.conf import settings
from syncr.app.flickr import FlickrSyncr

class Command(BaseCommand):

    def handle(self, *args, **options):
        
        f = FlickrSyncr(settings.API_KEY, settings.API_SECRET)
        f.syncRecentPhotos('samuelclay', days=7)
