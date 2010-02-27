from django.db import models
from django.db.models import signals


class Checkin(models.Model):
    """
    A model handing checkins of a user from brightkite. More here: http://groups.google.com/group/brightkite-api
    Right now I am trying to keep things simple as brightkite api is in beta phase. 
    """
    place_id = models.CharField(max_length=50)
    location = models.CharField(max_length=150)
    tiny_avtar = models.URLField(verify_exists=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField()
    checkin_id = models.CharField(max_length=50)
    
    def __unicode__(self):
        return self.location
    
    def get_absolute_url(self):
        # Create your own hyperlink. For now pointing to Brightkite
        return 'http://brightkite.com/objects/' + self.checkin_id
    
    class Meta:
        ordering = ('-created_at',)
    