# GoogleCodeSyncr - 0.1.0
#
# Author:  Maxime Haineault <haineault@gmail.com>
# License: MIT License ~ http://www.opensource.org/licenses/mit-license.php
# Documentation: http://code.google.com/p/django-syncr/wiki/SyncrGoogleCode

import time, re
from datetime import datetime
from syncr.googlecode.models import GoogleCodeSvnChange, GoogleCodeProjectDownload
from django.conf import settings

# This apps depends on feedparser (http://www.feedparser.org/)
# You might have to change the following import path
import feedparser

# Put the projects you want to sync in a list
# To determine the project slug, use the project URL
# For example: http://code.google.com/p/django-syncr/
# In this case, the project slug is 'django-syncr'

# GC_SVNCHANGES = ['project1-slug', 'project2-slug']
# GC_PROJECTDOWNLOADS = ['project1-slug', 'project2-slug']


GC_SVNCHANGES           = getattr(settings, 'GC_SVNCHANGES', [])
GC_PROJECTDOWNLOADS     = getattr(settings, 'GC_PROJECTDOWNLOADS', [])
GC_PROJECTDOWNLOADS_URL = getattr(settings, 'GC_PROJECTDOWNLOADS_URL', 'http://code.google.com/feeds/p/%s/downloads/basic')
GC_SVNCHANGES_URL       = getattr(settings, 'GC_SVNCHANGES_URL', 'http://code.google.com/feeds/p/%s/svnchanges/basic')


class GoogleCodeSyncr:
    """
    GoogleCodeSyncr objects sync Google Code feeds with the Django backend.

    As now only Downloads list and SVN commits log can be sync
    """

    def syncProjectDownloads(self):
        """
        Synchronize Downloads list from a Google Code project with the Django backend
        """
        
        for proj in GC_PROJECTDOWNLOADS:
            self.feed = feedparser.parse(GC_PROJECTDOWNLOADS_URL % proj)

            for entry in self.feed.entries:
                d = entry.updated_parsed
                sc = GoogleCodeProjectDownload(
                        date_updated = datetime(d[0], d[1], d[2], d[3], d[4], d[5], d[6]),
                        subtitle = entry.subtitle,
                        link = entry.links[0].href,
                        title = entry.title,
                        project = proj,
                        author = entry.author,
                )
                try:
                    sc.save()
                except:
                    pass

    def syncSvnChanges(self):
        """
        Synchronize SVN commits from a Google Code project with the Django backend
        """
        p = re.compile('\d+')
        r = re.compile("Revision\s\d+:\s(.*)")

        for proj in GC_SVNCHANGES:
            self.feed = feedparser.parse(GC_SVNCHANGES_URL % proj)

            for entry in self.feed.entries:
                revision = int(p.search(entry.id).group())
                titlematch = r.match(entry.title)
                if titlematch:
                    title = '%s' % titlematch.group(1)
                else:
                    title = '%s' % entry.title
                        
                d = entry.updated_parsed
                sc = GoogleCodeSvnChange(
                        date_updated = datetime(d[0], d[1], d[2], d[3], d[4], d[5], d[6]),
                        subtitle = entry.subtitle,
                        link = entry.link,
                        title = title,
                        project = proj,
                        author = entry.author,
                        rev = revision,
                )
                try:
                    sc.save()
                except:
                    pass
