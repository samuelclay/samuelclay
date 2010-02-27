from django.contrib import admin
from syncr.youtube.models import Video, Playlist, PlaylistVideo, YoutubeUser

class VideoAdmin(admin.ModelAdmin):
	list_display = ('title', 'author', 'video_id', 'view_count')

class PlaylistAdmin(admin.ModelAdmin):
	list_display = ('title', 'description', 'author', 'numVideos')
	
class PlaylistVideoAdmin(admin.ModelAdmin):
	list_display = ('title', 'description')

class YoutubeUserAdmin(admin.ModelAdmin):
	list_display = ('username', 'first_name', 'age', 'gender', 'watch_count')

admin.site.register(Video, VideoAdmin)
admin.site.register(Playlist, PlaylistAdmin)
admin.site.register(PlaylistVideo, PlaylistVideoAdmin)
admin.site.register(YoutubeUser, YoutubeUserAdmin)
