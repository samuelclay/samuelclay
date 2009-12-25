from django.shortcuts import render_to_response
from django.views.decorators.cache import cache_page
from django.core.cache import cache
import feedparser
import datetime
import twitter

# @cache_page(60 * 15)
def index(request):
    blog = cache.get('blog')
    if not blog:
        blog = _fetch_and_parse_blog()
        cache.set('blog', blog, 60 * 10)
        
    tweets = cache.get('tweets')
    if not tweets:
        tweets = _fetch_and_parse_twitter()
        cache.set('tweets', tweets, 60 * 10)
    
    return render_to_response('index.html', {
        'blog_entries': blog.entries,
        'tweets': tweets
    })
    
def _fetch_and_parse_blog():
    blog = feedparser.parse('http://www.ofbrooklyn.com/sunraylab/blog/rss/')
    for b in blog['entries']:
        b.updated_parsed = datetime.datetime(*b.updated_parsed[:-3])
    return blog

def _fetch_and_parse_twitter():
    twitter_api = twitter.Api()
    tweets = twitter_api.GetUserTimeline('samuelclay')
    shown_tweets = []
    for t in tweets:
        if t.text.find('@') != 0:
            shown_tweets.append(t)
    
    return shown_tweets