from django.db import models
from datetime import datetime
from tagging.fields import TagField
import time

RATINGS = (
	('1', "1 Star"),
	('2', "2 Stars"),
	('3', "3 Stars"),
	('4', "4 Stars"),
	('5', "5 Stars"),
)

class Link(models.Model):
	title = models.CharField(max_length=100)
	slug = models.SlugField(
		unique_for_date='add_date'
	)
	magnolia_id = models.CharField(max_length=20, blank=True, null=True)
	url = models.URLField()
	description = models.TextField(blank=True, null=True)
	screen_url = models.URLField('screenshot url')
	rating = models.CharField(max_length=1, choices=RATINGS)
	add_date = models.DateTimeField()
	tags = TagField()
		
	class Meta:
		ordering = ['-add_date']
       
	def __str__(self):
		return self.title
	
	def get_absolute_url(self):
		return "/maglinks/%s/%s" % (self.add_date.strftime("%Y/%b/%d").lower(), self.slug)