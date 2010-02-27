"""
TODO:
- finish the couple of methods that are not working yet
 - favorites
 - sync recent
"""


import calendar
from datetime import datetime, timedelta
from time import strptime
import math
import gdata.photos.service
import gdata.media
import gdata.geo
from django.core.exceptions import ObjectDoesNotExist
from syncr.picasaweb.models import Photo, Album, FavoriteList

class PicasawebSyncrError(Exception):
    pass

class PicasawebSyncr:
    """PicasaSyncr objects sync picasaweb photos, photo sets, and favorites
    lists with the Django backend.

    It does not currently sync user meta-data. Photo, PhotoSet, and
    FavoriteList objects include some meta-data, but are mostly Django
    ManyToManyFields to Photo objects.

    This app requires google gdata library. Available at:
    http://code.google.com/p/gdata-python-client/downloads/list
    """
    def __init__(self, email, password, cli_verbose=False):
        """Construct a new PicasawebSyncr object.

        Required arguments
          email: a google email (username)
          password: account password
        """
	self.cli_verbose = cli_verbose
	self.email = email
	gd_client = gdata.photos.service.PhotosService()
	gd_client.email = email
	gd_client.password = password
	gd_client.source = 'django-syncr-picasaweb'
	gd_client.ProgrammaticLogin()
	self.gd_client = gd_client

    def getExifKey(self, exif_data, key):
	try:
	    return exif_data[key]
	except:
	    return ''
        
    def getPhotoTagList(self, username, albumname, gphoto_id):
	if self.cli_verbose:
	    print ">>> getPhotoTagList", username, albumname, gphoto_id
	feed = self.gd_client.GetFeed('/data/feed/api/user/%s/album/%s/photoid/%s?kind=tag' % (username, albumname, gphoto_id))
	return ' '.join(entry.title.text for entry in feed.entry)
	
    def _syncPhoto(self, photo_entry, username, albumname=None, refresh=False):
        """Synchronize a picasaweb photo with the Django backend.

        Required Arguments
          photo_entry: A google data api photo entry
        """
        gphoto_id = photo_entry.gphoto_id.text
	#if self.cli_verbose:
	#    print "syncPhoto album %s id %s" % (albumname, gphoto_id)
        # if we're refreshing this data, then delete the Photo first...
        if refresh:
            try:
                p = Photo.objects.get(gphoto_id=gphoto_id)
                p.delete()
            except ObjectDoesNotExist:
                pass
        
	if albumname is None:
	    if self.cli_verbose:
		print "Albumname unknown getAlbumFeed for", username
	    feed = self.getAlbumFeed(username=username)
	    album_id = photo_entry.albumid.text
	    albums = [album for album in feed.entry if album.gphoto_id.text==album_id]
	    if len(albums)!=1:
		raise PicasawebSyncrError("No such album found for: %s" % album_or_id)
	    albumname = albums[0].name.text
	
	updated = datetime(*strptime(photo_entry.updated.text[:-4] + '000Z', "%Y-%m-%dT%H:%M:%S.000Z")[:7])	
	try:
	    geo_latitude = photo_entry.geo.latitude()
	    geo_longtitude = photo_entry.geo.longtitude()
	except:
	    geo_latitude = ""
	    geo_longtitude = ""

	default_dict = {
	    'updated': updated,
	    'gphoto_id': gphoto_id,
	    'owner': username,
	    'title': photo_entry.title.text,
	    'description': photo_entry.summary.text or "",
	    'taken_date': datetime(
		*strptime(photo_entry.timestamp.isoformat()[:-4] +
			  '000Z', "%Y-%m-%dT%H:%M:%S.000Z")[:7]),
	    'photopage_url': photo_entry.GetAlternateLink().href,
	    #'square_url': urls['Square'],
	    'small_url': photo_entry.media.thumbnail[0].url,
	    'medium_url': photo_entry.media.thumbnail[1].url,
	    'thumbnail_url': photo_entry.media.thumbnail[2].url,
	    'content_url': photo_entry.media.content[0].url,
	    'tags': photo_entry.media.keywords.text,
	    #'license': photo_xml.photo[0]['license'],
	    'geo_latitude': geo_latitude,
	    'geo_longitude': geo_longtitude,
	    'exif_model': photo_entry.exif.model and photo_entry.exif.model.text or "",
	    'exif_make': photo_entry.exif.make and photo_entry.exif.make.text or "",
	    #'exif_orientation': photo_entry.exif.,
	    'exif_exposure': photo_entry.exif.exposure and photo_entry.exif.exposure.text or "",
	    #'exif_software': photo_entry.exif.,
	    #'exif_aperture': photo_entry.exif.,
	    'exif_iso': photo_entry.exif.iso and photo_entry.exif.iso.text or "",
	    #'exif_metering_mode': ,
	    'exif_flash': photo_entry.exif.flash and photo_entry.exif.flash.text or "",
	    'exif_focal_length': photo_entry.exif.focallength and photo_entry.exif.focallength.text or "",
	    #'exif_color_space': self.getExifKey(exif_data, 'Color Space'),
	}

	obj, created = Photo.objects.get_or_create(gphoto_id = gphoto_id,
                                                   defaults=default_dict)
	if self.cli_verbose:
	    status = created and "created" or "already exists (same)"
	    if obj.updated<updated:
		status = "updated"
	    print "photo", obj, status
	    
	if not created and obj.updated<updated:
	    # update object
	    for key, value in default_dict.items():
		setattr(obj, key, value)
	    obj.save()
        return obj

    # TODO: syncPhoto    

    # TODO: syncRecent

    def getAlbumFeed(self, username=None):
	kwargs = {}
	if username is not None:
	    kwargs.setdefault('user', username)
	feed = self.gd_client.GetUserFeed(**kwargs)
	return feed

    def syncAlbum(self, album, username=None):
	if isinstance(album, (int, long, str)):
	    feed = self.getAlbumFeed(username=username)
	    if isinstance(album, (int, long)):
		album_id = "%s" % album
		albums = [album for album in feed.entry if album.gphoto_id.text==album_id]
	    else:
		album_name = album
		albums = [album for album in feed.entry if album.name.text==album_name]
	    if len(albums)!=1:
		raise PicasawebSyncrError("No such album found for: %s (found %s)" % (album, albums))
	    album = albums[0]
	
	updated = datetime(*strptime(album.updated.text[:-4] +
				     '000Z', "%Y-%m-%dT%H:%M:%S.000Z")[:7])	
	gphoto_id = album.gphoto_id.text
	username = album.user.text
	nickname = album.nickname.text
	numphotos = int(album.numphotos.text)
	albumname = album.name.text
	location = album.location.text
	if location is None:
	    location = ""
	default_dict = {
	    'gphoto_id': gphoto_id,
	    'albumname': albumname,
	    'owner': username,
	    'nickname': nickname,
	    'title': album.title.text,
	    'description': album.summary.text or "",
	    'location': location,
	    'updated': updated,
	    'access': album.access.text,
	}
	d_album, created = Album.objects.get_or_create(gphoto_id=gphoto_id,
							defaults=default_dict)
	if self.cli_verbose:
	    status = created and "created" or "already exists (same)"
	    if not created and d_album.updated<updated:
		status = "updated"
	    print "Album", album.title.text, status
	if not created and d_album.updated<updated:
	    for key, value in default_dict.items():
		setattr(d_album, key, value)
	    d_album.save()
	
	# get photo list
	feed_url = '/data/feed/api/user/%s/album/%s' % (username, albumname)
	feed_url += '?kind=photo'
	
	# if the PICASA_THUMBSIZES and PICASA_IMGMAX values are set in settings.py,
	# then include those settings in the feed url
	from django.conf import settings

	# PICASA_THUMBSIZES can be set in settings.py as a tuple of three
	# sizes. E.g. ( '72c', '160c', '288',)
	# This setting controls the sizes of the thumbnails provided
	if getattr(settings, 'PICASA_THUMBSIZES', False):
	    feed_url += '&thumbsize=%s' % ','.join(settings.PICASA_THUMBSIZES)
	# PICASA_IMGMAX can be set in settings.py to allow content_url to be
	# used directly in an <img> tag if this is set to a size up to 800.
	if getattr(settings, 'PICASA_IMGMAX', False):
	    feed_url += '&imgmax=%s' % settings.PICASA_IMGMAX
	
	photo_feed = self.gd_client.GetFeed(feed_url)
	
	for photo_entry in photo_feed.entry:
	    photo = self._syncPhoto(photo_entry, username, albumname=albumname)
	    if photo:
		d_album.photos.add(photo)
	feed_ids = set(photo_entry.gphoto_id.text for photo_entry in photo_feed.entry)
	local_ids = set(e['gphoto_id'] for e in d_album.photos.values('gphoto_id'))
	photo_diff = (local_ids-feed_ids)
	if self.cli_verbose:
	    if photo_diff:
		print "Sync deletes photos:", photo_diff
	for gphoto_id in photo_diff:
	    photo = d_album.photos.get(gphoto_id=gphoto_id)
	    photo.delete()
	
    def syncAllAlbums(self, username=None):
        """Synchronize all photo albums for the picasaweb user.
	
	Optional arguments:
	 username: username of another user to sync public albums with as string
        """
	if self.cli_verbose:
	    print "Sync all albums for", username or self.email
	feed = self.getAlbumFeed(username=username)

        for album in feed.entry:
            self.syncAlbum(album)
