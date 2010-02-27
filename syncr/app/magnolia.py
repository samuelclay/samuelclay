""" MagnoliaSyncr objects syncr magnolia links with Django backend
    
    It supports all features provided by Magnolia api. I also syncr rating item for 
    each link. Every link also includes screenshot for display purpose. Check out the
    magnolia-syncr documentation for more."""

import pymagnolia
from syncr.magnolia.models import Link
import time, datetime, re
from django.conf import settings

class MagnoliaSyncr:
	def syncmag(self):
		api = pymagnolia.MagnoliaApi(settings.MAGNOLIA_API)
		bms = api.bookmarks_find(person=settings.MAGNOLIA_USERNAME)
		for b in bms:
			pubdate = time.strptime(b.created, "%Y-%m-%dT%H:%M:%S-07:00")
			pub_time = datetime.datetime.fromtimestamp(time.mktime(pubdate))
			slugfield = re.sub(r'[^a-z0-9-]+', '-', b.title.lower()).strip('-')
			default_dict = { 'title': b.title, 'magnolia_id' : b.id, 'url' : b.url, 'description' : b.description, 'screen_url' : b.screenshot, 'rating' : b.rating, 'tags' : ', '.join(b.tags), 'slug' : slugfield }
			p, created = Link.objects.get_or_create(add_date = pub_time, defaults = default_dict)
