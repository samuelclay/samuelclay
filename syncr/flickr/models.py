from django.db import models
from django.utils.html import strip_tags
from django.utils.text import truncate_words
from django.utils.translation import ugettext_lazy as _
from django.conf import settings

from tagging.fields import TagField

FLICKR_LICENSES = (
    ('0', 'All Rights Reserved'),
    ('1', 'Attribution-NonCommercial-ShareAlike License'),
    ('2', 'Attribution-NonCommercial License'),
    ('3', 'Attribution-NonCommercial-NoDerivs License'),
    ('4', 'Attribution License'),
    ('5', 'Attribution-ShareAlike License'),
    ('6', 'Attribution-NoDerivs License'),
)

class BigIntegerField(models.IntegerField):
    """
    Defines a PostgreSQL compatible IntegerField needed to prevent 'integer 
    out of range' with large numbers.
    """
    def get_internal_type(self):
        return 'BigIntegerField'

    def db_type(self):
        if settings.DATABASE_ENGINE == 'oracle':
            db_type = 'NUMBER(19)'
        else:
            db_type = 'bigint'
        return db_type

class Photo(models.Model):
    flickr_id = BigIntegerField(unique=True)
    owner = models.CharField(max_length=50)
    owner_nsid = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique_for_date='taken_date',
                            help_text='Automatically built from the title.')
    description = models.TextField(blank=True)
    taken_date = models.DateTimeField()
    upload_date = models.DateTimeField() # New
    update_date = models.DateTimeField() # New (very)
    photopage_url = models.URLField()
    farm = models.PositiveSmallIntegerField() # New
    server = models.PositiveSmallIntegerField() # New
    secret = models.CharField(max_length=10) # New
    original_secret = models.CharField(max_length=10, blank=True)
    # square_url = models.URLField() # Old
    # thumbnail_url = models.URLField() # Old
    thumbnail_width = models.PositiveSmallIntegerField() # New
    thumbnail_height = models.PositiveSmallIntegerField() # New
    # small_url = models.URLField() # Old
    small_width = models.PositiveSmallIntegerField() # New
    small_height = models.PositiveSmallIntegerField() # New
    # medium_url = models.URLField() # Old
    medium_width = models.PositiveSmallIntegerField(null=True) # New
    medium_height = models.PositiveSmallIntegerField(null=True) # New
    large_width = models.PositiveSmallIntegerField(null=True) # New
    large_height = models.PositiveSmallIntegerField(null=True) # New
    original_width = models.PositiveSmallIntegerField() # New
    original_height = models.PositiveSmallIntegerField() # New
    tags = TagField(blank=True)
    enable_comments = models.BooleanField(default=True)
    license = models.CharField(max_length=50, choices=FLICKR_LICENSES)
    geo_latitude = models.FloatField(null=True)
    geo_longitude = models.FloatField(null=True)
    geo_accuracy = models.PositiveSmallIntegerField(null=True)
    geo_locality = models.CharField(max_length=200, blank=True) # New
    geo_county = models.CharField(max_length=200, blank=True) # New
    geo_region = models.CharField(max_length=200, blank=True) # New
    geo_country = models.CharField(max_length=200, blank=True) # New
    exif_make  = models.CharField(max_length=50, blank=True)
    exif_model = models.CharField(max_length=50, blank=True)
    exif_orientation = models.CharField(max_length=50, blank=True)
    exif_exposure = models.CharField(max_length=50, blank=True)
    exif_software = models.CharField(max_length=50, blank=True)
    exif_aperture = models.CharField(max_length=50, blank=True)
    exif_iso = models.CharField(max_length=50, blank=True)
    exif_metering_mode = models.CharField(max_length=50, blank=True)
    exif_flash = models.CharField(max_length=50, blank=True)
    exif_focal_length = models.CharField(max_length=50, blank=True)
    exif_color_space = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ('-taken_date',)
        get_latest_by = 'upload_date'

    def __unicode__(self):
        return u'%s' % self.title

    @models.permalink
    def get_absolute_url(self):
        return ('photo_detail', (), { 'year': self.taken_date.strftime('%Y'),
                                      'month': self.taken_date.strftime('%m'),
                                      'day': self.taken_date.strftime('%d'),
                                      'slug': self.slug })

    def _get_photo_url_helper(self, size, secret=None):
        size = size and '_%s' % size or ''
        if secret is None:
            secret = self.secret
        return u'http://farm%s.static.flickr.com/%s/%s_%s%s.jpg' % (
            self.farm, self.server, self.flickr_id, secret, size)

    def get_square_url(self):
        return self._get_photo_url_helper('s')

    def get_thumbnail_url(self):
        return self._get_photo_url_helper('t')

    def get_small_url(self):
        return self._get_photo_url_helper('m')

    def get_medium_url(self):
        if self.has_medium_photo:
            return self._get_photo_url_helper('')
        return self.get_original_url()

    def get_large_url(self):
        if self.has_large_photo:
            return self._get_photo_url_helper('b')
        return self.get_original_url()

    def get_original_url(self):
        if self.original_secret:
            return self._get_photo_url_helper('o', self.original_secret)
        return self._get_photo_url_helper('o')

    @property
    def has_medium_photo(self):
        if self.medium_width is not None:
            return True
        return False

    @property
    def has_large_photo(self):
        if self.large_width is not None:
            return True
        return False

    @property
    def has_original_photo(self):
        if self.original_width is not None:
            return True
        return False


    def _next_previous_helper(self, direction, photoset):
        order = direction == 'next' and 'taken_date' or '-taken_date'
        filter = direction == 'next' and 'gt' or 'lt'
        try:
            return self.photoset_set.get(pk=photoset.pk).photos.filter(
                **{'taken_date__%s' % filter: self.taken_date}
                ).order_by(order)[0]
        except IndexError:
            return None

    def get_next_in_set(self, *args, **kwargs):
        """
        Returns the next Entry with "live" status by ``pub_date``, if
        there is one, or ``None`` if there isn't.

        In public-facing templates, use this method instead of
        ``get_next_by_pub_date``, because ``get_next_by_pub_date``
        does not differentiate entry status.

        """
        return self._next_previous_helper('next', *args, **kwargs)

    def get_previous_in_set(self, *args, **kwargs):
        """
        Returns the previous Entry with "live" status by ``pub_date``,
        if there is one, or ``None`` if there isn't.

        In public-facing templates, use this method instead of
        ``get_previous_by_pub_date``, because
        ``get_previous_by_pub_date`` does not differentiate entry
        status..

        """
        return self._next_previous_helper('previous', *args, **kwargs)

class FavoriteList(models.Model):
    owner = models.CharField(max_length=50)
    sync_date = models.DateTimeField()
    photos = models.ManyToManyField('Photo')
    primary = models.ForeignKey( \
	'Photo', related_name='primary_in', null=True)

    def numPhotos(self):
        return len(self.photo_list.objects.all())

    def __unicode__(self):
        return u"%s's favorite photos" % self.owner

class PhotoSet(models.Model):
    flickr_id = models.CharField(primary_key=True, max_length=50)
    primary = models.ForeignKey('Photo', null=True, default=None,
                                related_name='primary_photo_set')
    owner = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    photos = models.ManyToManyField('Photo')

    class Meta:
        ordering = ('order',)

    def __unicode__(self):
        return u"%s photo set by %s" % (self.title, self.owner)

    @models.permalink
    def get_absolute_url(self):
        return ('photoset_detail', (), { 'object_id': self.pk })

    def get_photos_ordered_by_taken_date(self):
        """
        Return related photos sorded by ``taken_date`` (asc).

        """
        return self.photos.all().order_by('taken_date')

    def highlight(self):
        """
        Return the highlight image of this photo set.

        In case there isn't a ``primary`` image set, the first one is
        selected. (If this causes a ``IndexError``, ``None`` is
        returned.)

        """
        if self.primary is not None:
            return self.primary
        try:
            return self.photos.all()[0]
        except IndexError:
            return None

    def get_time_period(self):
        """
        Return dict with start and end of this photo set.

        Gets ``taken_date`` of first and last ``Photo`` and returns
        results as dict::

            { 'start': datetime.datetime, 'end': datetime.datetime }

        """
        start_photo = self.photos.order_by('taken_date')[0]
        end_photo = self.photos.order_by('-taken_date')[0]
        if start_photo.taken_date and end_photo.taken_date:
            return {'start': start_photo.taken_date, 'end': end_photo.taken_date}
        return {'start': start_photo.upload_date, 'end': end_photo.upload_date}

    def get_primary_photo(self):
        if self.primary is not None:
            bits = (self.primary.get_absolute_url(), self.primary.get_square_url(), self.primary)
            return '<a href="%s"><img src="%s" width="75" height="75" alt="%s" /></a>' % bits
        return None
    get_primary_photo.allow_tags = True
    get_primary_photo.short_description = _(u'Highlight')

class PhotoComment(models.Model):
    flickr_id = models.CharField(primary_key=True, max_length=128)
    photo = models.ForeignKey('Photo')
    author_nsid = models.CharField(max_length=50)
    author = models.CharField(max_length=50)
    pub_date = models.DateTimeField()
    permanent_url = models.URLField(verify_exists=False)
    comment = models.TextField()

    class Meta:
        ordering = ('pub_date',)

    def __unicode__(self):
        return _(u"%(author)s said: %(comment)s") % {
            'author': self.author, 'comment': self.get_short_comment(4)}

    def get_absolute_url(self):
        return self.permanent_url

    def get_short_comment(self, num=6):
        return truncate_words(strip_tags(self.comment), num)
    get_short_comment.short_description = _(u'comment')

