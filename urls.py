from django.conf import settings
from django.conf.urls import url
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve

from com import views

admin.autodiscover()

urlpatterns = [
    url(r"^$", views.index, name="index"),
    re_path(
        r"^schedulerjones/?$",
        TemplateView.as_view(template_name="schedulerjones.html"),
        name="schedulerjones",
    ),
    re_path(r"^caselife/?$", TemplateView.as_view(template_name="caselife.html"), name="caselife"),
    re_path(r"^sunraylab/?$", TemplateView.as_view(template_name="sunraylab.html"), name="sunraylab"),
    re_path(
        r"^brainexplorer/?$", TemplateView.as_view(template_name="brainexplorer.html"), name="brainexplorer"
    ),
    re_path(
        r"^donationparty/?$", TemplateView.as_view(template_name="donationparty.html"), name="donationparty"
    ),
    re_path(r"^kickpoint/?$", TemplateView.as_view(template_name="kickpoint.html"), name="kickpoint"),
    re_path(r"^podlife/?$", TemplateView.as_view(template_name="podlife.html"), name="podlife"),
    re_path(
        r"^raphael/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../raphael"},
    ),
    re_path(
        r"^schedulerjones/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../schedulerjones"},
    ),
    re_path(
        r"^caselife/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../caselife"},
    ),
    re_path(
        r"^sunraylab/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../sunraylab"},
    ),
    re_path(r"^boston-bikes/$", views.bikes, name="bikes"),
    re_path(
        r"^boston-bikes/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../bikes"},
    ),
    re_path(
        r"^kickpoint/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../kickpoint"},
    ),
    re_path(
        r"^podlife/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT + "/../podlife"},
    ),
    re_path(r"^portfolio/$", views.portfolio, name="portfolio"),
    re_path(r"^portfolio/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT + "/../portfolio"}),
    path("admin/", admin.site.urls),
]


if settings.DEBUG:
    urlpatterns += [
        re_path(r"^static/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
