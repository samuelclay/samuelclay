from django.db import models
from django.db.models import signals
from datetime import datetime
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.template.loader import render_to_string
from tagging.fields import TagField

## If you are syncing from more than one tumblr source set the SOURCE_CHOICES

class TumblrPost(models.Model):
    SOURCE_CHOICES = (
       (1, 'username1.tumblr.com'),
       (2, 'usernam2.tumblr.com')
      )
    FORMAT_CHOICES = (
       (1, 'markdown'),
       (2, 'html'),
       (3, 'none')
      )
    content_type    = models.ForeignKey(ContentType)
    object_id       = models.PositiveIntegerField()
    source = models.IntegerField(choices=SOURCE_CHOICES, default=2)
    post_id = models.IntegerField()
    format = models.IntegerField(choices=FORMAT_CHOICES, default=1)
    post_link = models.URLField()
    tags = TagField()
    feed_item = models.URLField(blank=True)
    pub_time = models.DateTimeField()
    tumblelog = models.CharField(max_length=300)
    content_object  = generic.GenericForeignKey('content_type', 'object_id')
    
    
    def __unicode__(self):
        return str(self.post_id)
		
    def get_absolute_url(self):
        return ""
        
    def get_rendered_html(self):
        template_name = 'tumblr/%s.html' % (self.content_type.model)
        return render_to_string(template_name, { 'object': self })    
          
    class Meta:
        ordering = ('-pub_time',)


class TumblrPhoto(models.Model):
    url_to_photo = models.URLField()
    link_500 = models.URLField(blank=True, null=True)
    link_400 = models.URLField(blank=True, null=True)
    link_250 = models.URLField(blank=True, null=True)
    link_100 = models.URLField(blank=True, null=True)
    link_75 = models.URLField(blank=True, null=True)
    photo_caption = models.CharField(max_length=300)
    photo_id = models.IntegerField()

    def __unicode__(self):
        return self.photo_id

    def get_absolute_url(self):
        return ""

class TumblrLink(models.Model):
    link_text = models.CharField(max_length=500)
    link_url = models.URLField()
    link_id = models.IntegerField()
    link_description = models.TextField()

    def __unicode__(self):
        return self.link_id

    def get_absolute_url(self):
        return ""

class TumblrConversation(models.Model):
    conversation_text = models.TextField()
    conversation_title = models.CharField(max_length=300)
    conversation_id = models.IntegerField()
    
    def __unicode__(self):
        return self.conversation_id

    def get_absolute_url(self):
        return ""


class TumblrQuote(models.Model):
    quote_text = models.TextField()
    quote_source = models.CharField(max_length=1000)
    quote_id = models.IntegerField()
    
    def __unicode__(self):
        return self.quote_id

    def get_absolute_url(self):
        return ""


class TumblrRegular(models.Model):
    regular_body = models.TextField()
    regular_title = models.CharField(max_length=500)
    regular_id = models.IntegerField()
    
    def __unicode__(self):
        return self.regular_id

    def get_absolute_url(self):
        return ""

class TumblrAudio(models.Model):
    audio_player = models.TextField()
    audio_caption= models.CharField(max_length=500)
    audio_plays = models.IntegerField()
    audio_id = models.IntegerField()
    
    def __unicode__(self):
        return self.audio_id

    def get_absolute_url(self):
        return ""


class TumblrVideo(models.Model):
    video_caption = models.CharField(max_length=300)
    video_player = models.TextField()
    video_source = models.TextField()
    video_id = models.IntegerField()
    
    def __unicode__(self):
        return self.video_id

    def get_absolute_url(self):
        return ""    
