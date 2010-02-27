from django.db import models
from tagging.fields import TagField

PICASAWEB_ACCESS = (
    ('private', 'Private'),
    ('public', 'Public'),
)

## TODO: licenses here, but how to get them from the api

class Photo(models.Model):
    gphoto_id = models.CharField(max_length=50, unique=True, db_index=True) # or big numeric field?
    owner = models.CharField(max_length=50)
    nickname = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True) # summary in api
    taken_date = models.DateTimeField()
    photopage_url = models.URLField()
    #square_url = models.URLField()
    small_url = models.URLField()
    medium_url = models.URLField()
    thumbnail_url = models.URLField()
    content_url = models.URLField()
    #tag_list = models.CharField(max_length=250)
    tags = TagField()
    enable_comments = models.BooleanField(default=True)
    #license = models.CharField(max_length=50, choices=FLICKR_LICENSES)
    geo_latitude = models.CharField(max_length=50, blank=True)
    geo_longitude = models.CharField(max_length=50, blank=True)
    #geo_accuracy = models.CharField(max_length=50, blank=True)
    exif_make  = models.CharField(max_length=50, blank=True)
    exif_model = models.CharField(max_length=50, blank=True)
    #exif_orientation = models.CharField(max_length=50, blank=True)
    exif_exposure = models.CharField(max_length=50, blank=True)
    #exif_software = models.CharField(max_length=50, blank=True)
    #exif_aperture = models.CharField(max_length=50, blank=True)
    exif_iso = models.CharField(max_length=50, blank=True)
    #exif_metering_mode = models.CharField(max_length=50, blank=True)
    exif_flash = models.CharField(max_length=50, blank=True)
    exif_focal_length = models.CharField(max_length=50, blank=True)
    #exif_color_space = models.CharField(max_length=50, blank=True)
    updated = models.DateTimeField()
    
    def __unicode__(self):
        return u'%s' % self.title

    class Meta:
        ordering = ('-taken_date',)
        get_latest_by = 'taken_date'


class FavoriteList(models.Model):
    owner = models.CharField(max_length=50)
    sync_date = models.DateTimeField()
    photos = models.ManyToManyField('Photo')
    updated = models.DateTimeField()

    def numPhotos(self):
        return len(self.photo_list.objects.all())

    def __unicode__(self):
        return u"%s's favorite photos" % self.owner

class Album(models.Model):
    gphoto_id = models.CharField(max_length=50, unique=True, db_index=True) # or big numeric field?
    owner = models.CharField(max_length=50)	   # author in api
    nickname = models.CharField(max_length=50)
    albumname = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=512) # summary in api
    location = models.CharField(max_length=200)
    updated = models.DateTimeField()
    
    photos = models.ManyToManyField('Photo')
    access = models.CharField(max_length=10, choices=PICASAWEB_ACCESS)

    def numPhotos(self):
        return len(self.photos.objects.all())

    def __unicode__(self):
        return u"%s photo set by %s" % (self.title, self.owner)
