import calendar
from datetime import datetime, timedelta
import flickrapi
import math
from time import strptime

from django.core.exceptions import ObjectDoesNotExist
from django.template import defaultfilters
from django.utils.encoding import smart_str

from syncr.flickr.models import *
from syncr.flickr.slug import get_unique_slug_for_photo

class FlickrSyncr:
    """
    FlickrSyncr objects sync flickr photos, photo sets, and favorites
    lists with the Django backend.

    It does not currently sync user meta-data. Photo, PhotoSet, and
    FavoriteList objects include some meta-data, but are mostly Django
    ManyToManyFields to Photo objects.

    This app requires Beej's flickrapi library. Available at:
    http://flickrapi.sourceforge.net/
    """
    def __init__(self, flickr_key, flickr_secret):
        """
        Construct a new FlickrSyncr object.

        Required arguments
          flickr_key: a Flickr API key string
          flickr_secret: a Flickr secret key as a string
        """
        self.flickr = flickrapi.FlickrAPI(flickr_key, flickr_secret, format='xmlnode')

    def user2nsid(self, username):
        """
        Convert a flickr username to an NSID
        """
        return self.flickr.people_findByUsername(username=username).user[0]['nsid']

    def _getXMLNodeTag(self, node):
        try:
            return " ".join([x.text for x in node.photo[0].tags[0].tag])
        except AttributeError:
            return " "

    # Removed getPhotoSizeURLs() here

    def getPhotoSizes(self, photo_id):
        """
        Return a dictionary of image sizes for a flickr photo.

        Required arguments
          photo_id: a flickr photo id as a string
        """
        result = self.flickr.photos_getSizes(photo_id=photo_id)
        sizes = dict()
        # Set defaults to None
        for label in ('Square','Thumbnail','Small','Medium','Large','Original'):
            sizes[label] = {'width': None, 'height': None}
        # Set values given by flickr
        for el in result.sizes[0].size:
            sizes[el['label']]['width'] = el['width']
            sizes[el['label']]['height'] = el['height']
        return sizes

    def getPhotoComments(self, photo_id):
        """
        Return a list of all comments.

        Each comment is represented as dictionary in this format::

            comment = {
                'flickr_id': '1132823-183689226-72157594258079061'
                'author_nsid': '72875139@N00',
                'author': 'Ehudphilip',
                'pub_date': datetime.fromtimestamp(int('1156878239')),
                'permanent_url': 'http://www.flickr.com/photos/rappensuncle/183689226/#comment72157594258079061',
                'comment': 'Great shot!!'
            }

        Required arguments
          photo_id: a flickr photo id as a string
        """
        result = self.flickr.photos_comments_getList(photo_id=photo_id)
        # try if photo has comments
        try:
            raw_comments = result.comments[0].comment
        except AttributeError:
            return None

        comments = []
        for el in raw_comments:
                comments.append(
                    {
                        'flickr_id': el['id'],
                        'author_nsid': el['author'],
                        'author': el['authorname'],
                        'pub_date': datetime.fromtimestamp(int(el['datecreate'])),
                        'permanent_url': el['permalink'],
                        'comment': smart_str(el.text)
                    }
                )
        return comments

    def getExifInfo(self, photo_id):
        """
        Obtain the exif information for a photo_id

        Required arguments
          photo_id: a flickr photo id as a string
        """
        def getRawOrClean(xmlnode):
            try:
                return xmlnode.clean[0].text
            except AttributeError:
                try:
                    return xmlnode.raw[0].text
                except AttributeError:
                    return ''

        def testResultKey(result_elem, label):
            if result_elem['label'] == label:
                return getRawOrClean(result_elem)
            else:
                return None

        exif_data = {'Make': '', 'Model': '', 'Orientation': '',
                     'Exposure': '', 'Software': '', 'Aperture': '',
                     'ISO Speed': '', 'Metering Mode': '', 'Flash': '',
                     'Focal Length': '', 'Color Space': ''}
        try:
            result = self.flickr.photos_getExif(photo_id=photo_id)
        except flickrapi.FlickrError:
            return exif_data

        try:
            for exif_elem in result.photo[0].exif:
                for label in exif_data.keys():
                    data = testResultKey(exif_elem, label)
                    if data and not exif_data[label]:
                        exif_data[label] = data
            return exif_data
        except:
            return exif_data

    def getGeoLocation(self, photo_id):
        """
        Obtain the geographical location information for a photo_id

        Required Arguments
          photo_id: A flickr photo id
        """
        geo_data = {'latitude': None, 'longitude': None, 'accuracy': None,
                    'locality': '', 'county': '', 'region': '', 'country': ''}
        try:
            result = self.flickr.photos_geo_getLocation(photo_id=photo_id)
        except flickrapi.FlickrError:
            return geo_data

        geo_data['latitude'] = float(result.photo[0].location[0]['latitude'])
        geo_data['longitude'] = float(result.photo[0].location[0]['longitude'])
        geo_data['accuracy'] = result.photo[0].location[0]['accuracy']

        for bit in ('locality', 'county', 'region', 'country',):
            if hasattr(result.photo[0].location[0], bit):
                geo_data[bit] = getattr(result.photo[0].location[0], bit)[0].text

        return geo_data

    def getExifKey(self, exif_data, key):
        try:
            return exif_data[key]
        except KeyError:
            return ''

    def _syncPhoto(self, photo_xml, refresh=False):
        """
        Synchronize a flickr photo with the Django backend.

        Required Arguments
          photo_xml: A flickr photos in Flickrapi's REST XMLNode format
        """
        if photo_xml.photo[0]['media'] != 'photo': # Ignore media like videos
            return None
        photo_id = photo_xml.photo[0]['id']

        # if we're refreshing this data, then delete the Photo first...
        if refresh:
            try:
                p = Photo.objects.get(flickr_id = photo_id)
                p.delete()
            except ObjectDoesNotExist:
                pass

        sizes = self.getPhotoSizes(photo_id)
        # Removed urls = self.getPhotoSizeURLs(photo_id)
        exif_data = self.getExifInfo(photo_id)
        geo_data = self.getGeoLocation(photo_id)

        taken_date = datetime(*strptime(photo_xml.photo[0].dates[0]['taken'], "%Y-%m-%d %H:%M:%S")[:7])
        upload_date = datetime.fromtimestamp(int(photo_xml.photo[0].dates[0]['posted']))
        update_date = datetime.fromtimestamp(int(photo_xml.photo[0].dates[0]['lastupdate']))

        proposed_slug = defaultfilters.slugify(photo_xml.photo[0].title[0].text.lower())
        slug = get_unique_slug_for_photo(taken_date, proposed_slug)

        # Ignore tags if there are more chars than 255
        tags, count = '', 0
        for tag in [(t, len(t) + 1) for t in self._getXMLNodeTag(photo_xml).split()]:
            if 255 <= (count + tag[1] - 1):
                tags = tags[:-1]
                break
            if not tag[0].startswith('geo:'): # Exclude ugly geo-tags
                tags += u'%s ' % tag[0]
                count += tag[1]

        try:
            original_secret = photo_xml.photo[0]['originalsecret']
        except KeyError:
            original_secret = ''


        default_dict = {
            'flickr_id': photo_xml.photo[0]['id'],
            'owner': photo_xml.photo[0].owner[0]['username'],
            'owner_nsid': photo_xml.photo[0].owner[0]['nsid'],
            'title': photo_xml.photo[0].title[0].text, # TODO: Typography
            'slug': slug,
            'description': photo_xml.photo[0].description[0].text,
            'taken_date': taken_date,
            'upload_date': upload_date,
            'update_date': update_date,
            'photopage_url': photo_xml.photo[0].urls[0].url[0].text,
            'farm': photo_xml.photo[0]['farm'],
            'server': photo_xml.photo[0]['server'],
            'secret': photo_xml.photo[0]['secret'],
            'original_secret': original_secret,
            'thumbnail_width': sizes['Thumbnail']['width'],
            'thumbnail_height': sizes['Thumbnail']['height'],
            'small_width': sizes['Small']['width'],
            'small_height': sizes['Small']['height'],
            'medium_width': sizes['Medium']['width'],
            'medium_height': sizes['Medium']['height'],
            'large_width': sizes['Large']['width'],
            'large_height': sizes['Large']['height'],
            'original_width': sizes['Original']['width'] or 0,
            'original_height': sizes['Original']['height'] or 0,
            # Removed 'square_url': urls['Square'],
            # Removed 'small_url': urls['Small'],
            # Removed 'medium_url': urls['Medium'],
            # Removed 'thumbnail_url': urls['Thumbnail'],
            'tags': tags,
            'license': photo_xml.photo[0]['license'],
            'geo_latitude': geo_data['latitude'],
            'geo_longitude': geo_data['longitude'],
            'geo_accuracy': geo_data['accuracy'],
            'geo_locality': geo_data['locality'],
            'geo_county': geo_data['county'],
            'geo_region': geo_data['region'],
            'geo_country': geo_data['country'],
            'exif_model': self.getExifKey(exif_data, 'Model'),
            'exif_make': self.getExifKey(exif_data, 'Make'),
            'exif_orientation': self.getExifKey(exif_data, 'Orientation'),
            'exif_exposure': self.getExifKey(exif_data, 'Exposure'),
            'exif_software': self.getExifKey(exif_data, 'Software'),
            'exif_aperture': self.getExifKey(exif_data, 'Aperture'),
            'exif_iso': self.getExifKey(exif_data, 'ISO Speed'),
            'exif_metering_mode': self.getExifKey(exif_data, 'Metering Mode'),
            'exif_flash': self.getExifKey(exif_data, 'Flash'),
            'exif_focal_length': self.getExifKey(exif_data, 'Focal Length'),
            'exif_color_space': self.getExifKey(exif_data, 'Color Space'),
        }

        obj, created = Photo.objects.get_or_create(
            flickr_id = photo_xml.photo[0]['id'], defaults=default_dict)

        # update if something changed
        if obj.update_date < update_date:
            # Never overwrite URL-relevant attributes
            default_dict['slug'] = obj.slug
            default_dict['taken_date'] = obj.taken_date

            updated_obj = Photo(pk=obj.pk, **default_dict)
            updated_obj.save()

        # Comments
        comments = self.getPhotoComments(obj.flickr_id)
        if comments is not None:
            for c in comments:
                c['photo'] = obj
                comment, created = PhotoComment.objects.get_or_create(
                                        flickr_id=c['flickr_id'], defaults=c)
        return obj

    def _syncPhotoXMLList(self, photos_xml):
        """
        Synchronize a list of flickr photos with Django ORM.

        Required Arguments
          photos_xml: A list of photos in Flickrapi's REST XMLNode format.
        """
        photo_list = []
        for photo in photos_xml:
            photo_result = self.flickr.photos_getInfo(photo_id = photo['id'])
            photo_list.append(self._syncPhoto(photo_result))
        return photo_list

    def syncPhoto(self, photo_id, refresh=False):
        """
        Synchronize a single flickr photo with Django ORM.

        Required Arguments
          photo_id: A flickr photo_id
        Optional Arguments
          refresh: A boolean, if true the Photo will be re-sync'd with flickr
        """
        photo_result = self.flickr.photos_getInfo(photo_id = photo_id)
        photo = self._syncPhoto(photo_result, refresh=refresh)
        return photo

    def syncAllPublic(self, username):
        """
        Synchronize all of a flickr user's photos with Django.
        WARNING: This could take a while!

        Required arguments
          username: a flickr username as a string
        """
        nsid = self.user2nsid(username)
        count = per_page = int(self.flickr.people_getInfo(
		user_id=nsid).person[0].photos[0].count[0].text)
        if count >= 500:
            per_page = 500
        pages = count // per_page
        
        for page in range(0, pages):
            result = self.flickr.people_getPublicPhotos(
		user_id=nsid, per_page=per_page, page=page)
            self._syncPhotoXMLList(result.photos[0].photo)

    def syncRecentPhotos(self, username, days=1):
        """
        Synchronize recent public photos from a flickr user.

        Required arguments
          username: a flickr username as a string
        Optional arguments
          days: sync photos since this number of days, defaults
                to 1 (yesterday)
        """
        syncSince = datetime.now() - timedelta(days=days)
        timestamp = calendar.timegm(syncSince.timetuple())
        nsid = self.user2nsid(username)

        result = self.flickr.photos_search(user_id=nsid, per_page=500,
                                           min_upload_date=timestamp)
        page_count = result.photos[0]['pages']

        for page in range(1, int(page_count)+1):
            photo_list = self._syncPhotoXMLList(result.photos[0].photo)
            result = self.flickr.photos_search(user_id=nsid, page=page+1,
                        per_page=500, min_upload_date=timestamp)

    def syncPublicFavorites(self, username):
        """Synchronize a flickr user's public favorites.

        Required arguments
          username: a flickr user name as a string
        """
        nsid = self.user2nsid(username)
        favList, created = FavoriteList.objects.get_or_create( \
	    owner = username, defaults = {'sync_date': datetime.now()})

        result = self.flickr.favorites_getPublicList(user_id=nsid, per_page=500)
        page_count = int(result.photos[0]['pages'])
        for page in range(1, page_count+1):
            photo_list = self._syncPhotoXMLList(result.photos[0].photo)
            for photo in photo_list:
                favList.photos.add(photo)
		if page == 1:
		    favList.primary = photo
		    favList.save()
            result = self.flickr.favorites_getPublicList(user_id=nsid,
                        per_page=500, page=page+1)

    def syncPhotoSet(self, photoset_id, order=None):
        """
        Synchronize a single flickr photo set based on the set id.

        Required arguments
          photoset_id: a flickr photoset id number as a string
        """
        photoset_xml = self.flickr.photosets_getInfo(photoset_id = photoset_id)
        nsid = photoset_xml.photoset[0]['owner']
        username = self.flickr.people_getInfo(user_id = nsid).person[0].username[0].text
        result = self.flickr.photosets_getPhotos(photoset_id = photoset_id)
        page_count = int(result.photoset[0]['pages'])
	primary = self.syncPhoto(photoset_xml.photoset[0]['primary'])

        d_photoset, created = PhotoSet.objects.get_or_create(
                flickr_id = photoset_id,
                defaults = {
			'owner': username,
			'flickr_id': result.photoset[0]['id'],
			'title': photoset_xml.photoset[0].title[0].text,
			'description': photoset_xml.photoset[0].description[0].text,
			'primary': primary,
			'order': order
			}
		)
	if not created: # update it
	    d_photoset.owner  = username
	    d_photoset.title  = photoset_xml.photoset[0].title[0].text
	    d_photoset.description=photoset_xml.photoset[0].description[0].text
	    d_photoset.primary = primary
	    d_photoset.save()

	page_count = int(result.photoset[0]['pages'])
	
        for page in range(1, page_count+1):
            if page > 1:
                result = self.flickr.photosets_getPhotos(
                    photoset_id = photoset_id, page = page+1)
            photo_list = self._syncPhotoXMLList(result.photoset[0].photo)
            for photo in photo_list:
                if photo is not None:
                    d_photoset.photos.add(photo)

        # Set primary photo and order
        d_photoset.primary = Photo.objects.get(flickr_id__exact=result.photoset[0]['primary']) # TODO: This query isn't in need, we have the ``flickr_id``...
        d_photoset.order = order
        d_photoset.save()

    def syncAllPhotoSets(self, username):
        """
        Synchronize all photo sets for a flickr user.

        Required arguments
          username: a flickr username as a string
        """
        nsid = self.user2nsid(username)
        result = self.flickr.photosets_getList(user_id=nsid)

        for i, photoset in enumerate(result.photosets[0].photoset):
            self.syncPhotoSet(photoset['id'], i + 1)
