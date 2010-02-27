from brightkite.models import Checkin
import time, datetime
import urllib, dateutil.parser, dateutil.tz
from xml2dict import XML2Dict
from django.conf import settings
from bk import Brightkite

def synccheckins():
    """
    Sync's all checkins of a user from brightkite. Only checkins no notes.Notes should be handled through another
    API call. I am using xml2dict to parse XML into python dictionary. Apparently I am too lazy to parse XML.
    """
    bk = Brightkite(settings.BRIGHTKITE_USERNAME, settings.BRIGHTKITE_PASSWORD)
    checkins = bk.user_checkins(settings.BRIGHTKITE_USERNAME)
    for checkin in checkins['objects']['checkin']:
        created_at = dateutil.parser.parse(entry['created_at']['value'])
        if created_at.tzinfo:
            created_at = created_at.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
        try:
            clocation = entry['place']['display_location']['value']
        except:
            clocation = entry['place']['name']['value']
        default_dict = { 'location' : clocation, 'latitude' : entry['place']['latitude']['value'], 'longitude' : entry['place']['longitude']['value'], 'created_at' : created_at, 'place_id' : entry['place']['id']['value'], 'tiny_avtar' : entry['creator']['tiny_avatar_url']['value']}
        p, created = BrightkiteLocation.objects.get_or_create(checkin_id = entry['id']['value'], defaults = default_dict)