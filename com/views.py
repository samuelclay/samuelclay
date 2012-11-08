from django.core.cache import cache
# from django.views.decorators.cache import cache_page
import feedparser
import datetime
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
    "is eager to hear what you think.",
    "is modern day geekery.",
    "is going about it all wrong.",
    "is writing code. Right. Now.",
    "is making out with his dog again.",
    "is on a tea buying spree.",
    "is another former Clevelander.",
    "is in his element.",
    "is randomizing fields.",
    "is driving with the top down.",
]

# @cache_page(60)
def index(request):
    blog = cache.get('blog')
    if not blog:
        logging.debug(" ---> Fetching blog...")
        blog = _fetch_and_parse_blog()
        cache.set('blog', blog, 60 * 10)
    else:
        logging.debug(" ---> Cached blog.")
        
    tweets = cache.get('tweets')
    if not tweets and tweets != []:
        logging.debug(" ---> Fetching twitter...")
        tweets = _fetch_and_parse_twitter()
        cache.set('tweets', tweets, 60 * 10)
    else:
        logging.debug(" ---> Cached twitter.")
    
    photos = cache.get('photos')
    if not photos:
        logging.debug(" ---> Fetching flickr...")
        # photos = _fetch_and_parse_flickr()
        photos = Photo.objects.all().order_by('?')
        cache.set('photos', photos, 60 * 10)
    else:
        logging.debug(" ---> Cached flickr.")
    
    isa_quote = random.choice(ISA_QUOTES) 
    
    return respond(request, 'index.html', {
        'blog_entries': blog.entries,
        'tweets': tweets,
        'photos': photos,
        'isa_quote': isa_quote,
    })
    
def _fetch_and_parse_blog():
    blog = feedparser.parse('http://www.ofbrooklyn.com/feeds/all/')
    for b in blog['entries']:
        b.updated_parsed = datetime.datetime(*b.updated_parsed[:-3])
    return blog

def _fetch_and_parse_twitter():
    try:
        twitter_api = tweepy.API()
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
    