from django.contrib import admin
from syncr.magnolia.models import Link

class LinkAdmin(admin.ModelAdmin):
        prepopulated_fields = {"slug": ("title",)}
	list_display = ('title', 'url', 'rating', 'add_date')
	search_fields = ['title','description','url']
	
admin.site.register(Link, LinkAdmin)
