from models import *
import time, datetime
from django.contrib.contenttypes.models import ContentType
import urllib, dateutil.parser, dateutil.tz
from xml2dict import XML2Dict

FORMAT_HASH = { 'markdown' : 1, 'html' : 2 }

class TumblrSyncr:
    def syncposts(self, url):
        data = urllib.urlopen(url).read()
        x = XML2Dict()
        r1 = x.fromstring(data)
        if url == "http://username.tumblr.com/api/read":
            site = 1
        else:
            site = 2
        for post in r1['tumblr']['posts']['post']:
            if post['type']['value'] == 'photo':
                syncphoto(post, site)
            elif post['type']['value'] == 'link':
                synclink(post, site)
            elif post['type']['value'] == 'conversation':
                syncconversation(post, site)
            elif post['type']['value'] == 'quote':
                syncquote(post, site)
            elif post['type']['value'] == 'video':
                syncvideo(post, site)
            elif post['type']['value'] == 'audio':
                syncaudio(post, site)
            else:
                syncregular(post, site)
           


def syncphoto(post, site):     
    link_500 = link_400 = link_250 = link_100 = link_75 = ''
    for urls in post['photo-url']:
        if urls['max-width']['value'] == '500':
            link_500 = urls['value']
        elif urls['max-width']['value'] == '400':
            link_400 = urls['value']
        elif urls['max-width']['value'] == '250':
            link_250 = urls['value']
        elif urls['max-width']['value'] == '100':
            link_100 = urls['value']
        elif urls['max-width']['value'] == '75':
            link_75 = urls['value']
        else:
            pass    # Don't want some other resolution image
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
     pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    photo_caption =''
    try:
     photo_caption = post['photo-caption']['value']
    except:
     pass
    try:
     photo_link_url = post['photo-link-url']['value']
    except:
     photo_link_url = ''
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'url_to_photo' : photo_link_url, 'link_500' : link_500, 'link_400' : link_400, 'link_250' : link_250, 'link_100' : link_100, 'link_75' : link_75, 'photo_caption' : photo_caption }
    p, created = TumblrPhoto.objects.get_or_create(photo_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags  }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)
         
            
def synclink(post, site):
    try:
     link_description_text = post['feed-item']['value']
    except:
     link_description_text = ''
    default_dict = { 'link_text' : post['link-text']['value'], 'link_url' : post['link-url']['value'], 'link_description' : link_description_text }
    p, created = TumblrLink.objects.get_or_create(link_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags    }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)

def syncconversation(post, site):
    default_dict = { 'conversation_text' : post['conversation-text']['value'], 'conversation_title' : post['conversation-title']['value'] }
    p, created = TumblrConversation.objects.get_or_create(conversation_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags    }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)    

def syncquote(post, site):
    default_dict = { 'quote_source' : post['quote-source']['value'], 'quote_text' : post['quote-text']['value'] }
    p, created = TumblrQuote.objects.get_or_create(quote_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags    }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)    

def syncvideo(post, site):
    default_dict = { 'video_caption' : post['video-caption']['value'], 'video_player' : post['video-player']['value'], 'video_source' : post['video-source']['value'] }
    p, created = TumblrVideo.objects.get_or_create(video_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags    }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)    

def syncregular(post, site):
    try:
     regular_body_body = post['regular-body']['value']
    except:
     regular_body_body = ''
    try:
     regular_title_title = post['regular-title']['value']
    except:
     regular_title_title = ''
    default_dict = { 'regular_body' : regular_body_body, 'regular_title' : regular_title_title }
    p, created = TumblrRegular.objects.get_or_create(regular_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags   }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)    

def syncAudio(post, site):
    default_dict = { 'audio_player' : post['audio-player']['value'], 'audio_caption' : post['audio-caption']['value'], 'audio_plays' : post['audio-plays']['value'] }
    p, created = TumblrAudio.objects.get_or_create(audio_id = post['id']['value'], defaults = default_dict)
    ctype = ContentType.objects.get_for_model(p)
    try:
        format = FORMAT_HASH[post['format']['value']]
    except:
        format = 3
    pub_time = dateutil.parser.parse(post['date-gmt']['value'])
    if pub_time.tzinfo:
        pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
    try:
     feed_item_link = post['feed-item']['value']
    except:
     feed_item_link = ''
    try:
     tags_tags = post['tag']['value']
    except:
     tags_tags = ''
    default_dict = { 'source' : site, 'post_id' : post['id']['value'], 'format': format, 'post_link' : post['url']['value'], 'pub_time' : pub_time, 'feed_item' : feed_item_link, 'tags' : tags_tags    }
    q, created = TumblrPost.objects.get_or_create(content_type=ctype, object_id=p.id, defaults=default_dict)    
