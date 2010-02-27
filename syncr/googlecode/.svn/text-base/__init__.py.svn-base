"""django-syncr: Synchronize Django with the web.

This project supplies everything needed to sync a Django project
with several web APIs. It currently supports 4 services:
   - Flickr (http://flickr.com)
   - YouTube (http://youtube.com)
   - del.icio.us (http://del.icio.us)
   - Twitter (http://twitter.com)
   - Ma.gnolia (http://ma.gnolia.com)

Additional web services can be added easily. Suggestions for
more services and/or patches welcome!

DEPENDENCIES

Each syncr app has different dependencies, but generally you should
have ElementTree. ET is included in Python 2.5, but for older versions
you need to download it from http://effbot.org/zone/element-index.htm.

The twitter app depends on python-twitter, available at:
http://code.google.com/p/python-twitter/

The magnolia app depends on pymagnolia, available at:
http://www.everes.net/pymagnolia/
For working I have place the pymagnolia.py in magnolia app.

The flickr app depends on Beej's Python flickrapi, available at:
http://flickrapi.sourceforge.net/

INSTALLATION / USAGE

1. Add the syncr app to your PYTHONPATH. I recommend creating a directory
   for local python packages (like /Users/jesse/python-local/), copying the
   'syncr' folder (and other "local" apps) there, then adding python-local to
   your PYTHONPATH.
2. Modify your Django settings file for your project. Add the appropriate
   syncr modules to INSTALLED_APPS. Available modules are:
   'syncr.flickr'
   'syncr.youtube'
   'syncr.twitter'
   'syncr.delicious'
   'syncr.magnolia'
3. Use the interfaces provided in syncr.app to write scripts
   for synchronizing the web service data with the Django backend.

   For example:
   
   from syncr.app.flickr import FlickrSyncr

   f = FlickrSyncr(API_KEY, API_SECRET)
   
   # sync all my photos from the past week...
   f.syncRecentPhotos('jesselegg', days=7)

   # sync my favorite photos
   f.syncPublicFavorites('jesselegg')

4. Explore the results in the Django admin interface.

CHANGELOG

v0.37 (August 3, 2008)
 * Added magnolia syncr app to sync magnolia bookmarks to you django project.
 * Supports all the features provided by magnolia.
 * Include rating for each bookmark and also screenshot of the link.
 * check out the magnolia-syncr documentation in doc folder.

v0.36 (May 30, 2008)
 * Added syncUserUploads method to YoutubeSyncr class
 * Added uploads field to YoutubeUser model as M2M with related name 'uploaded_by'
 * Changed related name of favorites field in YoutubeUser model to 'favorited_by'
 * Fixed a bug in timedelta usage with FlickrSyncr

v0.35 (April 17, 2008)
 * FlickrSyncr requires the use of flickrapi 1.2 (http://flickrapi.sourceforge.net/)
 * Fixed a bunch of bugs related to Flickr syncing (or not) exif and other data
 * Fixed miscellaneous typos that people submitted (THANKS GUYS!)

v0.31 (Mar 18, 2008)
  * Bug fixes; now works with Python 2.3
  * Changed User models for Twitter and Youtube, now users TwitterUser and YoutubeUser

v0.30 (Mar 18, 2008)
  * Added support for Flickr EXIF data (Thanks Yash!)
  * Added Flickr Geo data (latitutde, longitude and accuracy)
  * These two changes will break your models.
  * Changed Twitter User model to allow Followers and Friends to be null
  * Added syncPhoto method to FlickrSyncr to sync an individual photo
  * Added ability to refresh individual photos by passing refresh=True to the new syncPhoto method

v0.21 (Feb 20, 2008)
  * Bug fixes with FlickrSyncr and YoutubeSyncr

v0.20 (Feb 19, 2008)
  *Initial release
"""

__author__ = 'jesse@jesselegg.com'
__version__ = '0.36'
