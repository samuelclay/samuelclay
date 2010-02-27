from django.db import models
from django.conf import settings
from tagging.fields import TagField

class Bookmark(models.Model):
    # description, href, tags, extended, dt
    description = models.CharField(max_length=250, blank=True)
    url = models.URLField(unique=True)
    tags = TagField()
    extended_info = models.TextField(blank=True)
    post_hash = models.CharField(max_length=100)
    saved_date = models.DateTimeField()

    class Meta:
        ordering = ('-saved_date',)
        get_latest_by = 'saved_date'

    def __unicode__(self):
        return self.description

    @models.permalink
    def get_absolute_url(self):
        return ('bookmark_detail', (), { 'year': self.saved_date.strftime('%Y'),
                                         'month': self.saved_date.strftime('%m'),
                                         'day': self.saved_date.strftime('%d'),
                                         'object_id': self.id })

    def local_saved_date(self):
	'''
	Convert the delicious saved datetime to the timezone specified in
	DJANGO_SETTINGS_MODULE. Requires pytz.
	'''
	import pytz
	zone = pytz.timezone(settings.TIME_ZONE)
	return self.saved_date.replace(tzinfo=pytz.utc).astimezone(zone)
