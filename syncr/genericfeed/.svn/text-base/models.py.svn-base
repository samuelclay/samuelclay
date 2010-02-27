from django.db import models

class GenericFeed(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    title = models.CharField(max_length=255)
    link = models.URLField()
    
    class Meta:
        abstract = True

class Feed(GenericFeed):
    """A model based on a generic Atom or RSS syndication feed.  Atom terminology is
    used for the model and field names.
    """
    subtitle = models.CharField(max_length=255)
    version = models.CharField(max_length=30)
    
    def __unicode__(self):
        return "%s" % self.title

class Entry(GenericFeed):
    """An entry within a feed."""
    author = models.CharField(max_length=255)
    published = models.DateTimeField()
    updated = models.DateTimeField()
    summary = models.TextField()
    content = models.TextField()
    feed = models.ForeignKey(Feed)
    
    def __unicode__(self):
        return "%s" % self.title
    
    class Meta:
        ordering = ('-published',)
        verbose_name_plural = 'entries'
