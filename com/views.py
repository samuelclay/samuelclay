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
    # if tweets is None:
    #     logging.debug(" ---> Fetching twitter...")
    #     tweets = _fetch_and_parse_twitter()
    #     cache.set('tweets', tweets, 60 * 60 * 24)
    # else:
    #     logging.debug(" ---> Cached twitter.")

    isa_quote = _choose_is_a_quote()
    year = datetime.datetime.now().year

    return render(
        request,
        "index.html",
        {
            "blog_entries": blog_entries,
            # "tweets": tweets,
            "isa_quote": isa_quote,
            "year": year,
        },
    )


def _choose_is_a_quote():
    quotes = [
        "is up on a hill in San Francisco.",
        # "is going about it all wrong.",
        "is writing code. Right. Now.",
        # "is making out with his dog again.", # Poor Shiloh
        "is rewriting and rewriting.",
        "is a Clevelander outside Ohio.",
        "is in his element.",
        "is randomizing fields.",
        "is ahead of schedule.",
        "is driving with the top down.",
        "is flying past on his bike.",
        "is skating into the night.",
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
#     """Fetch tweets from Nitter RSS feed"""
#     try:
#         # Try multiple Nitter instances in case one is down
#         nitter_instances = [
#             "https://nitter.privacydev.net/samuelclay/rss",
#             "https://nitter.1d4.us/samuelclay/rss",
#             "https://nitter.kavin.rocks/samuelclay/rss",
#         ]

#         twitter_feed = None
#         headers = {
#             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
#         }

#         for instance_url in nitter_instances:
#             try:
#                 logging.debug(f" ---> Trying Nitter instance: {instance_url}")
#                 response = requests.get(instance_url, headers=headers, timeout=10)
#                 if response.status_code == 200:
#                     twitter_feed = feedparser.parse(response.content)
#                     if twitter_feed and twitter_feed.get('entries'):
#                         logging.debug(f" ---> Successfully fetched {len(twitter_feed.entries)} tweets from {instance_url}")
#                         break
#                 else:
#                     logging.debug(f" ---> HTTP {response.status_code} from {instance_url}")
#             except Exception as e:
#                 logging.debug(f" ---> Failed to fetch from {instance_url}: {e}")
#                 continue

#         if not twitter_feed or not twitter_feed.get('entries'):
#             logging.debug(" ---> No tweets found from any Nitter instance")
#             return []

#         tweets = []
#         for entry in twitter_feed['entries'][:12]:
#             # Parse the description to get clean text
#             soup = BeautifulSoup(entry.get('description', entry.get('summary', '')), 'html.parser')
#             text = soup.get_text().strip()

#             # Extract tweet ID from link
#             tweet_id = entry.link.split('/')[-1].split('#')[0] if entry.link else ''

#             # Convert published_parsed time tuple to datetime
#             published_dt = None
#             if hasattr(entry, 'published_parsed') and entry.published_parsed:
#                 published_dt = datetime.datetime.fromtimestamp(time.mktime(entry.published_parsed))

#             tweets.append({
#                 'relative_created_at': "%s ago" % relative_timesince(published_dt) if published_dt else '',
#                 'text': text,
#                 'id': tweet_id,
#             })

#         return tweets
#     except Exception as e:
#         logging.error(f" ---> Error fetching tweets from Nitter: {e}")
#         return []


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
