from django.contrib import admin
from syncr.delicious.models import Bookmark

class BookmarkAdmin(admin.ModelAdmin):
	list_display = ('saved_date', 'description', 'extended_info')
	search_fields = ['description', 'extended_info']
	date_hierarchy = 'saved_date'

admin.site.register(Bookmark, BookmarkAdmin)