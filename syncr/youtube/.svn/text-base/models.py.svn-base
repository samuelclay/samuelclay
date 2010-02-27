from django.db import models
from django.contrib.auth.models import User
from tagging.models import Tag, TaggedItem


class Video(models.Model):
    feed        = models.URLField()
    video_id    = models.CharField(max_length=50)
    published   = models.DateTimeField()
    updated     = models.DateTimeField()
    title       = models.CharField(max_length=250)
    author      = models.ForeignKey('YoutubeUser')
    description = models.TextField(blank=True)
    tag_list    = models.CharField(max_length=250)
    view_count  = models.PositiveIntegerField()
    url         = models.URLField()
    thumbnail_url = models.URLField(blank=True)
    length      = models.PositiveIntegerField()

    def _get_tags(self):
        return Tag.objects.get_for_object(self)
    def _set_tags(self, tag_list):
        Tag.objects.update_tags(self, tag_list)
    tags = property(_get_tags, _set_tags)

    def save(self, force_insert=False, force_update=False):
        super(Video, self).save(force_insert=force_insert,
				force_update=force_update)
        Tag.objects.update_tags(self, self.tag_list)

    def embed_url(self):
        return u'http://www.youtube.com/v/%s' % self.video_id

    def __unicode__(self):
        return u'%s' % self.title

class Playlist(models.Model):
    feed        = models.URLField()
    updated     = models.DateTimeField()
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author      = models.ForeignKey('YoutubeUser')
    url         = models.URLField()
    videos      = models.ManyToManyField('PlaylistVideo')

    def __unicode__(self):
        return u'%s' % self.title

    def numVideos(self):
        return self.videos.count()

class PlaylistVideo(models.Model):
    feed        = models.URLField()
    title       = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    original    = models.ForeignKey('Video')

    def __unicode__(self):
        return u'%s' % self.title
    
class YoutubeUser(models.Model):
    GENDER_CHOICES = (
        ('m', 'Male'),
        ('f', 'Female'))
    feed        = models.URLField()
    username    = models.CharField(max_length=50)
    first_name  = models.CharField(max_length=50)
    age         = models.PositiveIntegerField(null=True, blank=True)
    gender      = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    thumbnail_url = models.URLField()
    watch_count = models.PositiveIntegerField()
    url         = models.URLField()
    playlists   = models.ManyToManyField('Playlist')
    favorites   = models.ManyToManyField('Video', related_name='favorited_by')
    uploads     = models.ManyToManyField('Video', related_name='uploaded_by')
    user        = models.OneToOneField(User, related_name="youtube_acct",
                                       null=True, blank=True)

    def __unicode__(self):
        return u'%s' % self.username
    
    def sync(self):
        from syncr.app.youtube import YoutubeSyncr
        yts = YoutubeSyncr()
        yts.syncUser(self.username)
        yts.syncUserUploads(self.username)
        yts.syncUserFavorites(self.username)
        yts.syncUserPlaylists(self.username)
        
