from django.db import models
from django.conf import settings
from syncr.flickr.models import BigIntegerField

class Tweet(models.Model):
    pub_time    = models.DateTimeField()
    twitter_id  = BigIntegerField(unique=True)
    text        = models.TextField()
    user        = models.ForeignKey('TwitterUser')

    def __unicode__(self):
        return u'%s %s' % (self.user.screen_name, self.pub_time)

    def url(self):
        return u'http://twitter.com/%s/statuses/%s' % (self.user.screen_name, self.twitter_id)

    def local_pub_time(self):
	'''
	Convert the Twitter timestamp stored in pub_time to the timezone
	specified in DJANGO_SETTINGS_MODULE. Requires pytz.
	'''
	import pytz
	zone = pytz.timezone(settings.TIME_ZONE)
	return self.pub_time.replace(tzinfo=pytz.utc).astimezone(zone)
    
class TwitterUser(models.Model):
    screen_name = models.CharField(max_length=50)
    description = models.CharField(max_length=250, blank=True, null=True)
    location    = models.CharField(max_length=50, blank=True, null=True)
    name        = models.CharField(max_length=50, blank=True, null=True)
    thumbnail_url = models.URLField()
    url         = models.URLField(blank=True, null=True)
    friends     = models.ManyToManyField('self', symmetrical=False,
					 blank=True, null=True,
					 related_name='friends_user_set')
    followers   = models.ManyToManyField('self', symmetrical=False,
					 blank=True, null=True,
					 related_name='followers_user_set')

    def numFriends(self):
        return self.friends.count()

    def numFollowers(self):
        return self.followers.count()

    def __unicode__(self):
        return self.screen_name
