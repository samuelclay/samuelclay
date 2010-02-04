from django.conf.urls.defaults import *
from django.contrib import admin
from django.conf import settings
admin.autodiscover()

urlpatterns = patterns('',
    (r'^/?$', 'com.views.index'),
    (r'^raphael/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../raphael'}),
    (r'^schedulerjones/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../schedulerjones'}),
    (r'^caselife/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../caselife'}),
    (r'^admin/', include(admin.site.urls)),
)


if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
         {'document_root': settings.MEDIA_ROOT}),
    )