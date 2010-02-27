"""
Syncr related views.
"""
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from django.views.generic.date_based import object_detail

from syncr.flickr.models import Photo, PhotoSet

def flickr_photo_detail_in_set(request, year, month, day, slug, set_id,
                               extra_context='', *args, **kwargs):
    """
    A thin wrapper around
    ``django.views.generic.date_based.object_detail`` which adds
    the selected photo set to the context variables: ``photoset``.

    """
    set = get_object_or_404(PhotoSet, pk=set_id)
    photo = get_object_or_404(Photo, taken_date__year=year,
        taken_date__month=month, taken_date__day=day, slug=slug)

    previous = photo.get_previous_in_set(set)
    next = photo.get_next_in_set(set)

    extra_context = dict(extra_context, photoset=set,
        previous_photo_in_set=previous, next_photo_in_set=next)

    return object_detail(request, year=year, month=month, day=day, slug=slug,
                         extra_context=extra_context, *args, **kwargs)
