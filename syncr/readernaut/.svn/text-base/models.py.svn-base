from django.db import models
from django.db.models import signals


class Book(models.Model):
    """
    Readernaut model basing on the current public API dt 11/10/2008. If a book has multiple authors, all
    the author names are added into author field as comma seperated values. Feel free to implement 
    as you like.
    """
    book_id = models.IntegerField()
    author = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20)
    cover_small = models.URLField()
    cover_medium = models.URLField()
    cover_large = models.URLField()
    permalink = models.URLField()
    created = models.DateTimeField()
    modified = models.DateTimeField()
    
    def __unicode__(self):
        return "%s by %s" % (self.title, self.author)
    
    def get_absolute_url(self):
        return self.permalink        # Create your own hyperlink. For now pointing to Readernaut
    
    class Meta:
        ordering = ('-created',)