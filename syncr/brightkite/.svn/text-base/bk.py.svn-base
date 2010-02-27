"""
Depends on httplib2 and xml2dict

    easy_install httplib2
    svn checkout http://xml2dict.googlecode.com/svn/trunk/ xml2dict-read-only
    cp xml2dict-read-only/*.py brightkite/

There isn't any installer for the xml2dict package, and it isn't
packaged as a module either, so this non-standard install process
is probably the simplest solution you'll find.
"""

import httplib2
from urllib import quote
from xml2dict import XML2Dict
from xml.parsers.expat import ExpatError

class BrightkiteException(Exception):
    def __init__(self, description, xml):
        self.description = description
        self.xml = xml

    def __repr__(self):
        return u"BrightkiteException(%s)" % self.description


class Brightkite(object):
    def __init__(self, user, pw):
        self.user = user
        self.pw = pw
        self._xml = None
        self._http = None

    def _unescape_uri(self, uri):
        return uri.replace("%3A",":").replace("%3F","?").replace("%26","&").replace("%3D","=")

    def _get(self, uri):
        "Fetch content via the GET method. Returns body of returned content."
        uri = self._unescape_uri(uri)
        header, content = self.http.request(uri, "GET")
        return content

    def _post(self, uri, content={}):
        uri = self._unescape_uri(uri)
        header, content = self.http.request(uri, "POST", body=content)
        return content

    def _delete(self, uri):
        uri = self._unescape_uri(uri)
        header, content = self.http.request(uri, "GET")
        return content

    def _convert_xml(self, xml):
        "Stub method."
        try:
            return self.xml.fromstring(xml)
        except ExpatError:
            msg = "Couldn't parse response from Brightkite API."
            raise BrightkiteException(msg, xml)

    def _get_http(self):
        if self._http == None:
            self._http = httplib2.Http()
            self._http.add_credentials(self.user, self.pw)
        return self._http

    def _get_xml(self):
        if self._xml == None:
            self._xml = XML2Dict()
        return self._xml

    http = property(_get_http,None,None,"Httplib2 connection object.")
    xml = property(_get_xml,None,None,"Object for converting XML to Python.")

    """
    Exposed APIs

    Based on data at http://groups.google.com/group/brightkite-api/web/rest-api
    """

    def people(self, username):
        "Return data for user."
        uri = "http://brightkite.com/people/%s.xml" % username
        return self._convert_xml(self._get(quote(uri)))

    def search_people(self, username):
        "Return search results for user."
        uri ="http://brightkite.com/people/search.xml?query=%s" % username
        return self._convert_xml(self._get(quote(uri)))

    def friends(self, username=None):
        "Fetch friends for specified user, or self if no user specified."
        username = username or self.user
        uri = "http://brightkite.com/people/%s/friends.xml" % username
        return self._convert_xml(self._get(quote(uri)))

    def pending_friends(self, username):
        uri = "http://brightkite.com/people/%s/pending_friends.xml" % username
        return self._convert_xml(self._get(quote(uri)))

    def places(self, place_hash):
        "Fetch data for a place."
        uri = "http://brightkite.com/places/%s.xml" % place_hash
        return self._convert_xml(self._get(quote(uri)))

    def places_search(self, search_string):
        uri = "http://brightkite.com/places/search.xml?q=%s" % search_string
        return self._convert_xml(self._get(quote(uri)))

    def people_at_place(self, place_hash, radius=None, hours_ago=None):
        uri = "http://brightkite.com/places/%s/people.xml" % place_hash
        if radius is not None and hours_ago is not None:
            uri = u"%s?radius=%s&hours_ago=%s" % (uri, radius, hours_ago)
        elif radius is not None:
            uri = u"%s?radius=%s" % (uri, radius)
        elif hours_agi is not None:
            uri = u"%s?hours_ago=%s" % (uri, hours_ago)
        return self._convert_xml(self._get(quote(uri)))

    def checkings_at_place(self, place_hash):
        uri = "http://brightkite.com/places/%s/objects.xml?filters=checkins" % place_hash
        return self._convert_xml(self._get(quote(uri)))

    def notes(self, username):
        uri = "http://brightkite.com/people/%s/objects.xml?filters=note" % username
        return self._convert_xml(self._get(quote(uri)))

    def notes_and_photos(self, username):
        uri  = "http://brightkite.com/people/%s/objects.xml?filters=notes,photos" % username
        return self._convert_xml(self._get(quote(uri)))
        
    def user_checkins(self, username):
        uri = "http://brightkite.com/people/%s/objects.xml?filters=checkins" % username
        return self._convert_xml(self._get(quote(uri)))        

    def placemarks(self, username=None, place_hash=None):
        """
        Fetch placemarks for specified user or place.
        Will fetch your placemarks if neither keyword
        is specified.
        """
        if username is None and place_hash is None:
            uri = "http://brightkite.com/me/placemarks.xml"
        elif place_hash is None:
            uri = "http://brightkite.com/people/%s/placemarks.xml" % username
        else:
            uri = "http://brightkite.com/places/%s/placemarks.xml" % place_hash
        return self._convert_xml(self._get(quote(uri)))

    def comments(self, object_hash):
        uri = "http://brightkite.com/objects/%s/comments.xml" % object_hash
        return self._convert_xml(self._get(quote(uri)))

    def sent_messages(self):
        "Retrieve sent direct messages."
        uri = "http://brightkite.com/me/sent_messages.xml"
        return self._convert_xml(self._get(quote(uri)))

    def received_messages(self):
        "Retrieve retrieved direct messages."
        uri = "http://brightkite.com/me/received_messages.xml"
        return self._convert_xml(self._get(quote(uri)))

    def friendship(self, username):
        "Retrieve friendship information with specified friend's username."
        uri = "http://brightkite.com/people/%s/friendship.xml" % username
        return self._convert_xml(self._get(quote(uri)))

    def blocked_people(self):
        "Retrieved users you have blocked."
        uri = "http://brightkite.com/me/blocked_people.xml"
        return self._convert_xml(self._get(quote(uri)))

    def friend_stream(self):
        "Retrieve friend stream."
        uri = "http://brightkite.com/me/friendstream.xml"
        return self._convert_xml(self._get(quote(uri)))

    def nearby_stream(self):
        "Retrieve nearby stream."
        uri = "http://brightkite.com/me/nearbystream.xml"
        return self._convert_xml(self._get(quote(uri)))

    def mentions_stream(self):
        "Retrieve mentions stream."
        uri = "http://brightkite.com/me/mentionsstream.xml"
        return self._convert_xml(self._get(quote(uri)))

    def checkin(self, place_hash):
        "Checkin at given specified position."
        uri = "http://brightkite.com/places/%s/checkins" % place_hash
        self._post(uri)

    def delete_checkin(self, place_hash):
        "Delete a checkin at a position."
        uri = "http://brightkite.com/places/%s/checkins" % place_hash
        self._delete(uri)
        
    def create_note(self, place, note_text):
        "Create a note with specified text."
        uri = "http://brightkite.com/places/%s/notes" % place_hash
        self.post(uri, note=note_text)

    """
    All apis specified up not, but not including Photos are implemented
    in the order listed at http://groups.google.com/group/brightkite-api/web/rest-api
    there are a handful more to implement...
    """
