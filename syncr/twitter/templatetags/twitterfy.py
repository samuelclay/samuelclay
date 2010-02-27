import re

from django.utils.safestring import mark_safe
from django import template

register = template.Library()

@register.filter(name='twitterfy')
def twitterfy(tweet):
    
    # find hashtags
    pattern = re.compile(r"(?P<start>.?)#(?P<hashtag>[A-Za-z_]+)(?P<end>.?)")
    
    # replace with link to search
    link = r'\g<start>#<a href="http://search.twitter.com/search?q=\g<hashtag>"  title="#\g<hashtag> search Twitter">\g<hashtag></a>\g<end>'
    text = pattern.sub(link,tweet)
    
    # find usernames
    pattern = re.compile(r"(?P<start>.?)@(?P<user>[A-Za-z0-9_]+)(?P<end>.?)")
    
    # replace with link to profile
    link = r'\g<start>@<a href="http://twitter.com/\g<user>"  title="#\g<user> on Twitter">\g<user></a>\g<end>'
    text = pattern.sub(link,tweet)
    
    return mark_safe(text)
