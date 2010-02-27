# -*- coding: utf-8 -*-
import datetime

from django import template
from django.conf import settings
from django.db import connection
from django.db.models import Q
from django.template.defaultfilters import stringfilter
from django.utils.safestring import mark_safe

from syncr.flickr.models import Photo

register = template.Library()

######################################
# TEMPALTE TAGS                      #
######################################

###################
# CONTENT UTILS   #
###################

class RandomPhotoNode(template.Node):
    def __init__(self, num, varname):
        self.num, self.varname = int(num), varname

    def render(self, context):
        custom_filter = getattr(settings, 'FLICKR_RANDOM_PHOTO_FILTER', {})
        qn = connection.ops.quote_name
        qs = Photo.objects.filter(**custom_filter).extra(
            where=['%(width)s > %(height)s' % {
                    'width': qn('thumbnail_width'),
                    'height': qn('thumbnail_height')
                    }]
            ).order_by('?')
        if self.num is 0:
            self.num = len(qs)
        context[self.varname] = qs[:self.num]
        return ''

@register.tag(name="get_random_photos")
def get_random_photos(parser, token):
    """
    Retrieve a random ``Photo`` in landscape format and stores it in a
    context variable. It is possible to exclude some photos, by defining
    a dictionary in ``settings.FLICKR_RANDOM_PHOTO_FILTER``.

    When "number" is null (0) all photos will be selected.

    Syntax::

        {% get_random_photos [number] as [varname] %}

    Example::

        {% get_random_photos 10 as random_photos %}

    Settings example (selects only photos, which were taken after
    2005-09-11 and with either a 'Canon EOS 350D DIGITAL' or
    'DSC'-camera)::

        FLICKR_RANDOM_PHOTO_FILTER = {
            'taken_date__gte': datetime.datetime(2005, 9, 12),
            'exif_model__in': ['Canon EOS 350D DIGITAL', 'DSC']
        }

    """
    bits = token.contents.split()
    if len(bits) != 4:
        raise template.TemplateSyntaxError('get_random_photos tag takes exactly three arguments')
    if bits[2] != 'as':
        raise template.TemplateSyntaxError('third argument to get_random_photos tag must be "as"')
    return RandomPhotoNode(bits[1], bits[3])