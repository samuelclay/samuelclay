from django.core.cache import cache
from django.conf import settings
# from django.views.decorators.cache import cache_page
import feedparser
import datetime
import time
import random
import urllib2
import socket
from BeautifulSoup import BeautifulSoup 
import tweepy
import logging
from syncr.flickr.models import Photo
from com.common import respond
from util.dates import relative_timesince

socket.setdefaulttimeout(10)

NUM_PHOTOS_PER_ROW = 7

ISA_QUOTES = [
    "is up on a hill in San Francisco.",
    "is going about it all wrong.",
    "is writing code. Right. Now.",
    "is making out with his dog again.",
    "is on a tea buying spree.",
    "is a Clevelander outside Ohio.",
    "is in his element.",
    "is randomizing fields.",
    "is driving with the top down.",
]

# @cache_page(60)
def index(request):
    blog_entries = cache.get('blog_entries')
    if not blog_entries:
        logging.debug(" ---> Fetching blog...")
        blog_entries = _fetch_and_parse_blog()
        cache.set('blog_entries', blog_entries, 60 * 60 * 24)
    else:
        logging.debug(" ---> Cached blog.")
        
    tweets = cache.get('tweets')
    if not tweets and tweets != []:
        logging.debug(" ---> Fetching twitter...")
        tweets = _fetch_and_parse_twitter()
        cache.set('tweets', tweets, 60 * 60 * 24)
    else:
        logging.debug(" ---> Cached twitter.")
    
    photos = cache.get('photos')
    if not photos:
        logging.debug(" ---> Fetching flickr...")
        # photos = _fetch_and_parse_flickr()
        photos = Photo.objects.all().order_by('?')
        cache.set('photos', photos, 60 * 60 * 24)
    else:
        logging.debug(" ---> Cached flickr.")
    
    isa_quote = random.choice(ISA_QUOTES) 
    year = datetime.datetime.now().year
    
    return respond(request, 'index.html', {
        'blog_entries': blog_entries,
        'tweets': tweets,
        'photos': photos,
        'isa_quote': isa_quote,
        'year': year,
    })
    
def _fetch_and_parse_blog():
    blog = feedparser.parse('http://www.ofbrooklyn.com/feeds/all/')
    entries = []
    
    for entry in blog['entries']:
        entries.append({
            'link': entry.link,
            'title': entry.title,
            'date': datetime.datetime.fromtimestamp(time.mktime(entry.updated_parsed)),
        })
        
    return entries

def _fetch_and_parse_twitter():
    try:
        auth = tweepy.OAuthHandler(settings.TWITTER_CONSUMER_KEY, settings.TWITTER_CONSUMER_SECRET)
        auth.set_access_token(settings.TWITTER_ACCESS_TOKEN, settings.TWITTER_ACCESS_TOKEN_SECRET)
        twitter_api = tweepy.API(auth)
        tweets = twitter_api.user_timeline('samuelclay', exclude_replies=True, 
                                           count=100, trim_user=True, include_rts=False)
    except tweepy.TweepError:
        return []
        
    # shown_tweets = [t for t in tweets if not t.text.startswith('@')]
    fixed_tweets = []
    for tweet in tweets[:12]:
        fixed_tweets.append({
            'relative_created_at': "%s ago" % relative_timesince(tweet.created_at),
            'text': tweet.text,
            'id': tweet.id,
        })

    return fixed_tweets
    
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


def portfolio(request):
    return respond(request, 'portfolio.html', {
    })