from django.shortcuts import render_to_response
from django.views.decorators.cache import cache_page
from django.core.cache import cache
import feedparser
import datetime
import random
import urllib2
from BeautifulSoup import BeautifulSoup 
from util import twitter
from syncr.flickr.models import Photo

NUM_PHOTOS_PER_ROW = 7

@cache_page(60 * 15)
def index(request):
    blog = cache.get('blog')
    if not blog:
        blog = _fetch_and_parse_blog()
        cache.set('blog', blog, 60 * 10)
        
    tweets = cache.get('tweets')
    if not tweets:
        tweets = _fetch_and_parse_twitter()
        cache.set('tweets', tweets, 60 * 10)
    
    photos = cache.get('photos')
    if not photos:
        # photos = _fetch_and_parse_flickr()
        photos = Photo.objects.all().order_by('?')
        cache.set('photos', photos, 60 * 10)
        
    return render_to_response('index.html', {
        'blog_entries': blog.entries,
        'tweets': tweets,
        'photos': photos,
    })
    
def _fetch_and_parse_blog():
    blog = feedparser.parse('http://www.ofbrooklyn.com/feeds/all/')
    for b in blog['entries']:
        b.updated_parsed = datetime.datetime(*b.updated_parsed[:-3])
    return blog

def _fetch_and_parse_twitter():
    twitter_api = twitter.Api()
    tweets = twitter_api.GetUserTimeline('samuelclay')
    shown_tweets = [t for t in tweets if not t.text.startswith('@')]

    return shown_tweets
    
def _fetch_and_parse_flickr():
    flickr = urllib2.urlopen('http://www.flickr.com/photos/conesus/sets/72157623221750803/')
    soup = BeautifulSoup(flickr)
    photos = soup.findAll('div', 'setThumbs-indv')
    random.shuffle(photos)
    photos_count = len(photos)
    photos = photos[:photos_count - (photos_count%NUM_PHOTOS_PER_ROW)]
    
    for photo in photos:
        photo.find('a')['href'] = 'http://flickr.com' + photo.find('a')['href']
    for photo in photos[-NUM_PHOTOS_PER_ROW:]:
        photo['class'] += ' last'
    for photo in photos[::NUM_PHOTOS_PER_ROW]:
        photo['class'] += ' first'
    # photos = [str(BeautifulSoup(photo).findAll('a')[1]) for photo in photos]
    
    return photos
    
def chunks(l, n):
    """ Yield successive n-sized chunks from l.
    """
    new_l = []
    for i in range(0, len(l), n):
        new_l.append(l[i:i+n])
        
    return new_l