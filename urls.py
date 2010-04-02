from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template
from django.contrib import admin
from django.conf import settings
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^/?$', 'com.views.index', name="index"),
    url(r'^schedulerjones/?$', direct_to_template, {'template': 'schedulerjones.html'}, name="schedulerjones"),
    url(r'^caselife/?$', direct_to_template, {'template': 'caselife.html'}, name="caselife"),
    url(r'^sunraylab/?$', direct_to_template, {'template': 'sunraylab.html'}, name="sunraylab"),
    (r'^raphael/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../raphael'}),
    (r'^schedulerjones/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../schedulerjones'}),
    (r'^caselife/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../caselife'}),
    (r'^sunraylab/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../sunraylab'}),
    (r'^admin/', include(admin.site.urls)),
)


if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
         {'document_root': settings.MEDIA_ROOT}),
    )