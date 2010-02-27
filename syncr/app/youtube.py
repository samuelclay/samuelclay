import urllib
import datetime, time
from syncr.youtube.models import YoutubeUser, Video, Playlist, PlaylistVideo

try:
    import xml.etree.ElementTree as ET
except:
    import elementtree.ElementTree as ET

ATOM_NS         = 'http://www.w3.org/2005/Atom'
YOUTUBE_NS      = 'http://gdata.youtube.com/schemas/2007'
GDATA_NS        = 'http://schemas.google.com/g/2005'
MRSS_NS         = 'http://search.yahoo.com/mrss/'

class YoutubeSyncr:
    """YoutubeSyncr objects synchronize Youtube information with Django
    via the GData API. The Youtube API requires no authentication, so
    the construction method requires no parameters.

    YoutubeSyncr creates four kinds of data in the Django database. These
    are: Users, Videos, Playlists, and PlaylistVideos.

    User: contains the profile information for a Youtube user
    Video: contains the meta-data and URL information for a Youtube video
    Playlist: contains a list of Video objects, with some meta-data
    PlaylistVideo: a special Video object. See doc string for _syncPlaylistVideo

    The Youtube API provides a wealth of data, easily accessible. Thus
    this Syncr module is more sophisticated than the rest of django-syncr.

    This app requires the excellent ElementTree, which is included in
    Python 2.5. Otherwise available at:
    http://effbot.org/zone/element-index.htm
    """
    _youtubeGDataHost = 'gdata.youtube.com'
    _youtubeFeedBase  = '/feeds/api/'
    
    def _request(self, url):
        f = urllib.urlopen(url)
        tree = ET.parse(f)
        f.close()
        return tree

    def gtime2datetime(self, gtime):
        """Convert GData date and time to a Python datetime object.
        """
        fmt = '%Y-%m-%dT%H:%M:%S'
        gtime = gtime.split('.')[0]
        return datetime.datetime(*(time.strptime(gtime, fmt)[:7]))

    def syncVideo(self, video_id):
        """Synchronize a Youtube video based on id

        Required arguments
          video_id: a Youtube video id as a string
        """
        feed = 'http://' + self._youtubeGDataHost + self._youtubeFeedBase + 'videos/%s' % video_id
        return self.syncVideoFeed(feed)

    def syncVideoFeed(self, video_feed):
        """Synchronize a Youtube video based on GData URL

        Required arguments
          video_feed: a Youtube video GData feed URL
        """
        result = self._request(video_feed)
        video_id = result.findtext('{%s}id' % ATOM_NS).replace('http://' + self._youtubeGDataHost + self._youtubeFeedBase + 'videos/', '')
        default_dict = {
	    'feed': video_feed,
	    'video_id': video_id,
	    'published': self.gtime2datetime(result.findtext(
		    '{%s}published' % ATOM_NS)),
	    'updated': self.gtime2datetime(result.findtext(
		    '{%s}updated' % ATOM_NS)),
	    'title': result.findtext('{%s}title' % ATOM_NS),
	    'author': self.syncUserFeed(result.findtext(
		    '{%s}author/{%s}uri' % (ATOM_NS, ATOM_NS))),
	    'description': result.findtext(
		'{%s}group/{%s}description' % (MRSS_NS, MRSS_NS)) or '',
	    'tag_list': result.findtext(
		'{%s}group/{%s}keywords' % (MRSS_NS, MRSS_NS)),
	    'view_count': getattr(result.find('{%s}statistics' % YOUTUBE_NS),
				  'attrib', {}).get('viewCount', 0),
	    'url': filter(lambda x: x.attrib['rel'] == 'alternate',
			  result.findall('{%s}link' %
					 ATOM_NS))[0].attrib['href'],
	    'thumbnail_url': filter(lambda x: x.attrib['height'] == '240',
				    result.findall('{%s}group/{%s}thumbnail' % (MRSS_NS, MRSS_NS)))[0].attrib['url'],
	    'length': result.find('{%s}group/{%s}duration' %
				  (MRSS_NS, YOUTUBE_NS)).attrib['seconds'],
	    }
        obj, created = Video.objects.get_or_create(feed = video_feed,
                                                   defaults=default_dict)
        return obj

    def syncUser(self, username):
        """Synchronize a Youtube user profile based on username

        Required arguments
          username: a Youtube username string.
        """
        feed = 'http://' + self._youtubeGDataHost + self._youtubeFeedBase + 'users/%s' % username
        return self.syncUserFeed(feed)

    def syncUserFeed(self, user_feed):
        """Synchronize a Youtube user profile based on GData URL

        Required arguments
          user_feed: a Youtube user GData feed URL
        """
        result = self._request(user_feed).getroot()
        username = result.findtext('{%s}id' % ATOM_NS).replace('http://'+self._youtubeGDataHost+self._youtubeFeedBase+'users/', '')
        default_dict = {'feed': user_feed,
                        'username': username,
                        'first_name': result.findtext('{%s}firstName' % YOUTUBE_NS) or '',
                        'age': result.findtext('{%s}age' % YOUTUBE_NS),
                        'gender': result.findtext('{%s}gender' % YOUTUBE_NS) or '',
                        'thumbnail_url': '',
                        'url': filter(lambda x: x.attrib['rel'] == 'alternate',
                                      result.findall('{%s}link' % ATOM_NS))[0].attrib['href'],
                        'watch_count': 0,
                        }
	try:
	    if 'videoWatchCount' in result.find('{%s}statistics' % YOUTUBE_NS).keys():
		default_dict['watch_count'] = result.find('{%s}statistics' % YOUTUBE_NS).attrib['videoWatchCount']
	except AttributeError:
	    default_dict['watch_count'] = 0
	    
	if result.find('{%s}thumbnail' % MRSS_NS):
	    default_dict['thumbnail_url'] = result.find('{%s}thumbnail' % MRSS_NS).attrib['url']
	    
        obj, created = YoutubeUser.objects.get_or_create(username=username,
                                                  defaults=default_dict)
        return obj

    def _syncPlaylistVideo(self, entry):
        """Synchronize a Youtube playlist video with the Django ORM.

        NOTE: A playlist video differs from a regular video because Youtube
        users can change the title and description for each video in the
        playlist.

        Required arguments
          entry: an Element object for the video entry XML
        """
        original = self.syncVideoFeed(filter(lambda x: x.attrib['rel'] == 'related',
                                             entry.findall('{%s}link' % ATOM_NS))[0].attrib['href'])
        custom_desc = entry.findtext('{%s}description' % YOUTUBE_NS)
        default_dict = {'feed': entry.findtext('{%s}id' % ATOM_NS),
                        'title': entry.findtext('{%s}title' % ATOM_NS),
                        'description': custom_desc or entry.findtext('{%s}group/{%s}description' % (MRSS_NS, MRSS_NS)) or '',
                        'original': original,
                        }
        obj, created = PlaylistVideo.objects.get_or_create(feed = entry.findtext('{%s}id' % ATOM_NS),
                                                           defaults=default_dict)
        return obj
        
    def syncPlaylist(self, playlist_id):
        """Synchronize a Youtube playlist based on playlist id

        Required arguments
          playlist_id: a Youtube playlist id as a string
        """
        feed = 'http://' + self._youtubeGDataHost + self._youtubeFeedBase + 'playlists/%s' % playlist_id
        return self.syncPlaylistFeed(feed)

    def syncPlaylistFeed(self, playlist_feed):
        """Synchronize a Youtube playlist based on GData URL

        Required arguments
          playlist_feed: a Youtube playlist GData feed URL
        """
        result = self._request(playlist_feed)
        default_dict = {'feed': playlist_feed,
                        'updated': self.gtime2datetime(result.findtext('{%s}updated' % ATOM_NS)),
                        'title': result.findtext('{%s}title' % ATOM_NS) or '',
                        'description': result.findtext('{%s}group/{%s}description' % (MRSS_NS, MRSS_NS)) or '',
                        'author': self.syncUserFeed(result.findtext('{%s}author/{%s}uri' % (ATOM_NS, ATOM_NS))),
                        'url': filter(lambda x: x.attrib['rel'] == 'alternate',
                                      result.findall('{%s}link' % ATOM_NS))[0].attrib['href'],
                        }
        obj, created = Playlist.objects.get_or_create(feed = playlist_feed,
                                                      defaults=default_dict)
        for video in result.findall('{%s}entry' % ATOM_NS):
            plist_video = self._syncPlaylistVideo(video)
            obj.videos.add(plist_video)
        return obj

    def syncUserPlaylists(self, username):
        """Synchronize all playlists for a Youtube username.

        Required arguments
          username: a Youtube username as a string
        """
        user = self.syncUser(username)
        result = self._request('http://'+self._youtubeGDataHost+self._youtubeFeedBase+'users/%s/playlists' % username)
        for entry in result.findall('{%s}entry' % ATOM_NS):
            playlist_id = entry.findtext('{%s}id' % ATOM_NS).split('/')[-1]
            playlist_feed = 'http://'+self._youtubeGDataHost+self._youtubeFeedBase+'playlists/%s' % playlist_id
            playlist = self.syncPlaylistFeed(playlist_feed)
            user.playlists.add(playlist)
        return user.playlists.all()

    def syncUserFavorites(self, username):
        """Synchronize all favorite videos for a Youtube username

        Required arguments
          username: a Youtube username as a string
        """
        user = self.syncUser(username)
        videos = self._syncFeed('http://'+self._youtubeGDataHost+self._youtubeFeedBase+'users/%s/favorites' % username)
        for video in videos:
            user.favorites.add(video)
        return user.favorites.all()

    def syncUserUploads(self, username):
	"""Synchronize a user's uploads feed

	Required arguments
	  username: a Youtube username as a string
	"""
	user = self.syncUser(username)
	videos = self._syncFeed('http://'+self._youtubeGDataHost+self._youtubeFeedBase+'users/%s/uploads' % username)

	for video in videos:
	    user.uploads.add(video)
	return user.uploads.all()

    def _getSyncFeedParams(self, startIndex=None, maxResults=None):
        param_build = []
        if startIndex is not None:
            param_build.append('='.join(('start-index', str(startIndex))))
        if maxResults is not None:
            param_build.extend('='.join(('max-results', str(maxResults))))
        return '&'.join(param_build)

    def _syncFeedPage(self, feedURL, startIndex=None, maxResults=None):
        result = self._request('?'.join((feedURL, self._getSyncFeedParams(startIndex, maxResults))))
        for entry in result.findall('{%s}entry' % ATOM_NS):
            video = self.syncVideoFeed(entry.findtext('{%s}id' % ATOM_NS))
            yield video

    def _syncFeed(self, feedURL):
        startIndex = 1
        more = True
        while more:
            more = False
            for video in self._syncFeedPage(feedURL, startIndex=startIndex):
                more = True
                startIndex += 1
                yield video

