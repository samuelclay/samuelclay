import datetime
import logging
import random
import socket
import time

# from django.views.decorators.cache import cache_page
import feedparser
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.core.cache import cache
from django.shortcuts import render

from util.dates import relative_timesince

socket.setdefaulttimeout(10)

NUM_PHOTOS_PER_ROW = 7


# @cache_page(60)
def index(request):
    blog_entries = cache.get("blog_entries")
    if not blog_entries:
        logging.debug(" ---> Fetching blog...")
        blog_entries = _fetch_and_parse_blog()
        cache.set("blog_entries", blog_entries, 60 * 60 * 24)
    else:
        logging.debug(" ---> Cached blog.")

    # tweets = cache.get('tweets')
    # if not tweets and tweets != []:
    #     logging.debug(" ---> Fetching twitter...")
    #     tweets = _fetch_and_parse_twitter()
    #     cache.set('tweets', tweets, 60 * 60 * 24)
    # else:
    #     logging.debug(" ---> Cached twitter.")

    # photos = cache.get("photos")
    # if not photos:
    #     logging.debug(" ---> Fetching flickr...")
    #     # photos = _fetch_and_parse_flickr()
    #     photos = Photo.objects.all().order_by("?")
    #     cache.set("photos", photos, 60 * 60 * 24)
    # else:
    #     logging.debug(" ---> Cached flickr.")

    isa_quote = _choose_is_a_quote()
    year = datetime.datetime.now().year

    return render(
        request,
        "index.html",
        {
            "blog_entries": blog_entries,
            # 'tweets': tweets,
            # "photos": photos,
            "isa_quote": isa_quote,
            "year": year,
        },
    )


def _choose_is_a_quote():
    quotes = [
        # "is up on a hill in San Francisco.",
        "is going about it all wrong.",
        "is writing code. Right. Now.",
        # "is making out with his dog again.", # Poor Shiloh
        "is rewriting and rewriting.",
        "is a Clevelander outside Ohio.",
        "is in his element.",
        "is randomizing fields.",
        "is ahead of schedule.",
        # "is .",
        # "is driving with the top down.",
    ]

    now = datetime.datetime.now()
    # grad = datetime.datetime(2020, 5, 28)

    # if now < grad:
    #     quotes.append("is %s days away from graduation." % (grad - now).days)
    # else:
    #     quotes.append("is %s days past graduation." % (now - grad).days)

    return random.choice(quotes)


def _fetch_and_parse_blog():
    blog = feedparser.parse("http://www.ofbrooklyn.com/feeds/all/")
    entries = []

    for entry in blog["entries"]:
        entries.append(
            {
                "link": entry.link,
                "title": entry.title,
                "date": datetime.datetime.fromtimestamp(time.mktime(entry.updated_parsed)),
            }
        )

    return entries


# def _fetch_and_parse_twitter():
#     try:
#         auth = tweepy.OAuthHandler(settings.TWITTER_CONSUMER_KEY, settings.TWITTER_CONSUMER_SECRET)
#         auth.set_access_token(settings.TWITTER_ACCESS_TOKEN, settings.TWITTER_ACCESS_TOKEN_SECRET)
#         twitter_api = tweepy.API(auth)
#         tweets = twitter_api.user_timeline('samuelclay', exclude_replies=True,
#                                            count=100, trim_user=True, include_rts=False)
#     except tweepy.TweepError:
#         return []

#     # shown_tweets = [t for t in tweets if not t.text.startswith('@')]
#     fixed_tweets = []
#     for tweet in tweets[:12]:
#         text = tweet.text
#         for url in tweet.entities.get('urls', []):
#             if url['url'] in text:
#                 text = text.replace(url['url'], url['expanded_url'])
#         fixed_tweets.append({
#             'relative_created_at': "%s ago" % relative_timesince(tweet.created_at),
#             'text': text,
#             'id': tweet.id,
#         })

#     return fixed_tweets


# def _fetch_and_parse_flickr():
#     flickr = requests.get("http://www.flickr.com/photos/conesus/sets/72157623221750803/")
#     soup = BeautifulSoup(flickr.content)
#     photos = soup.findAll("div", "setThumbs-indv")
#     random.shuffle(photos)
#     photos_count = len(photos)
#     photos = photos[: photos_count - (photos_count % NUM_PHOTOS_PER_ROW)]

#     for photo in photos:
#         photo.find("a")["href"] = "http://flickr.com" + photo.find("a")["href"]
#     for photo in photos[-NUM_PHOTOS_PER_ROW:]:
#         photo["class"] += " last"
#     for photo in photos[::NUM_PHOTOS_PER_ROW]:
#         photo["class"] += " first"
#     # photos = [str(BeautifulSoup(photo).findAll('a')[1]) for photo in photos]

#     return photos


def chunks(l, n):
    """Yield successive n-sized chunks from l."""
    new_l = []
    for i in range(0, len(l), n):
        new_l.append(l[i : i + n])

    return new_l


def portfolio(request):
    return render(request, "portfolio.html", {})


def bikes(request):
    return render(request, settings.MEDIA_ROOT + "/../bikes/index.html", {})
