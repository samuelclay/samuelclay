# GoogleCodeSyncr
#
# Author:  Maxime Haineault <haineault@gmail.com>
# License: MIT License ~ http://www.opensource.org/licenses/mit-license.php
# Documentation: http://code.google.com/p/django-syncr/wiki/SyncrGoogleCode

from django.db import models

class GoogleCodeSvnChange(models.Model):
    date_updated  = models.DateTimeField()
    subtitle      = models.TextField()
    link          = models.CharField(max_length=250, unique=True)
    title         = models.CharField(max_length=250)
    project       = models.CharField(max_length=50)
    author        = models.CharField(max_length=50)
    rev           = models.PositiveIntegerField()

    def __unicode__(self):
        return u'r%s - %s' % (self.rev, self.title, )


class GoogleCodeProjectDownload(models.Model):
    date_updated  = models.DateTimeField()
    subtitle      = models.TextField()
    link          = models.CharField(max_length=250, unique=True)
    title         = models.CharField(max_length=250)
    project       = models.CharField(max_length=50)
    author        = models.CharField(max_length=50)

    def __unicode__(self):
        return u'%s' % self.title

