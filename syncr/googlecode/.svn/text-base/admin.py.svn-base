from django.contrib import admin
from syncr.googlecode.models import GoogleCodeSvnChange, GoogleCodeProjectDownload


class GoogleCodeSvnChangeAdmin(admin.ModelAdmin):
	list_display = ('date_updated', 'project', 'author', 'title')
	list_filter = ('author', 'project')
	search_fields = ['project', 'author', 'title', 'subtitle']
	date_hierarchy = 'date_updated'

admin.site.register(GoogleCodeSvnChange, GoogleCodeSvnChangeAdmin)


class GoogleCodeProjectDownloadAdmin(admin.ModelAdmin):
	list_display = ('date_updated', 'project', 'author', 'title')
	list_filter = ('author', 'project')
	search_fields = ['project', 'author', 'title', 'subtitle']
	date_hierarchy = 'date_updated'

admin.site.register(GoogleCodeProjectDownload, GoogleCodeProjectDownloadAdmin)
