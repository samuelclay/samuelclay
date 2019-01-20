from django.conf.urls.defaults import patterns, url, include
from django.views.generic import TemplateView
from django.contrib import admin
from django.conf import settings
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^/?$', 'com.views.index', name="index"),
    url(r'^schedulerjones/?$', TemplateView.as_view(template_name='schedulerjones.html'), name="schedulerjones"),
    url(r'^caselife/?$', TemplateView.as_view(template_name='caselife.html'), name="caselife"),
    url(r'^sunraylab/?$', TemplateView.as_view(template_name='sunraylab.html'), name="sunraylab"),
    url(r'^brainexplorer/?$', TemplateView.as_view(template_name='brainexplorer.html'), name="brainexplorer"),
    url(r'^donationparty/?$', TemplateView.as_view(template_name='donationparty.html'), name="donationparty"),
    url(r'^kickpoint/?$', TemplateView.as_view(template_name='kickpoint.html'), name="kickpoint"),
    url(r'^podlife/?$', TemplateView.as_view(template_name='podlife.html'), name="podlife"),
    (r'^raphael/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../raphael'}),
    (r'^schedulerjones/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../schedulerjones'}),
    (r'^caselife/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../caselife'}),
    (r'^sunraylab/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../sunraylab'}),
    url(r'^boston-bikes/$', 'com.views.bikes', name="bikes"),
    (r'^boston-bikes/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../bikes'}),
    (r'^kickpoint/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../kickpoint'}),
    (r'^podlife/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../podlife'}),
    url(r'^portfolio/$', 'com.views.portfolio', name="portfolio"),
    (r'^portfolio/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT+'/../portfolio'}),
    (r'^admin/', include(admin.site.urls)),
)


if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
         {'document_root': settings.MEDIA_ROOT}),
    )