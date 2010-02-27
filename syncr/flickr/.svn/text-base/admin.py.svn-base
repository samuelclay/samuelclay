from django.contrib import admin

from syncr.flickr.models import Photo, FavoriteList, PhotoSet, PhotoComment


class PhotoAdmin(admin.ModelAdmin):
    date_hierarchy = 'taken_date'
    list_display = ('taken_date', 'title', 'upload_date', 'flickr_id', 'owner', 'tags')
    list_display_links = ('title', 'flickr_id')
    list_filter = ('upload_date', 'taken_date')
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ['title', 'description']


class FavoriteListAdmin(admin.ModelAdmin):
    list_display = ('owner', 'sync_date', 'numPhotos')


class PhotoSetAdmin(admin.ModelAdmin):
    list_display = ('get_primary_photo', 'title', 'flickr_id', 'owner')
    list_display_links = ('title',)
    list_select_related = True # ``get_primary_photo`` uses a ForeignKey


class PhotoCommentAdmin(admin.ModelAdmin):
    date_hierarchy = 'pub_date'
    list_display = ('author', 'photo', 'get_short_comment', 'pub_date')
    list_display_links = ('author',)
    ordering = ('-pub_date',)
    search_fields = ['comment', 'author', 'photo__title']


admin.site.register(Photo, PhotoAdmin)
admin.site.register(FavoriteList, FavoriteListAdmin)
admin.site.register(PhotoSet, PhotoSetAdmin)
admin.site.register(PhotoComment, PhotoCommentAdmin)
