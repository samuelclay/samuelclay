from django.contrib import admin
from syncr.picasaweb.models import Photo, FavoriteList, Album

class PhotoAdmin(admin.ModelAdmin):
	list_display = ('taken_date', 'title', 'gphoto_id', 'owner')
	search_fields = ['title', 'description']
	date_hierarchy = 'taken_date'

class FavoriteListAdmin(admin.ModelAdmin):
	list_display = ('owner', 'sync_date', 'numPhotos')

class AlbumAdmin(admin.ModelAdmin):
	list_display = ('gphoto_id', 'owner', 'title')

admin.site.register(Photo, PhotoAdmin)
admin.site.register(FavoriteList, FavoriteListAdmin)
admin.site.register(Album, AlbumAdmin)