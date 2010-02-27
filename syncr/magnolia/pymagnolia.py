# -*- coding: utf8 -*-

import httplib, urllib

import xml.sax
from xml.sax.handler import ContentHandler

VERSION = '0.1'
AUTHOR = 'makoto tsuyuki'
AUTHOR_EMAIL = 'mtsuyuki_at_gmail_dot_com'
PROJECT_URL = 'http://www.everes.net/pymagnolia/'

CONTACT = '%s or %s' % (PROJECT_URL, AUTHOR_EMAIL)
DESCRIPTION = '''Python wrapper for ma.gnolia.com's API'''
LONG_DESCRIPTION = '%s' % (DESCRIPTION)

DEBUG = False
API_VERSION = '1'

def xmltoUtf(attrs, name='') :
  v = attrs.get(name)
  if v == None: return None
  return v.encode('utf8')

def set_data(params_candidate) :
  param = {}
  for key, value in params_candidate.iteritems() :
    if value == None or value == '' or value == []:
      pass
    else:
      if key == 'date_from' :
        param['from'] = value
      elif key == 'date_to' :
        param['to'] = value
      else :
        param[key] = value
  return param

def parametalize(params_candidate={}) :
  if params_candidate.has_key('self') :
    del params_candidate['self']
  return set_data(params_candidate)


class Bookmark(dict) :
  def __init__(self, created=None, private=False, updated=None,
                     id='', rating='0', owner='',
                     title='', url='', description='',
                     screenshot='', tags=[]) :
    self['created']     = created
    self['private']     = private
    self['updated']     = updated
    self['id']          = id
    self['rating']      = rating
    self['owner']       = owner
    self['title']       = title
    self['url']         = url
    self['description'] = description
    self['screenshot']  = screenshot
    self['tags']        = tags

  def __getattr__(self, name):
    try: return self[name]
    except: object.__getattribute__(self, name)

class PyMagnoliaError(Exception) :
  def __init__(self, code, message, method='', param={}):
    self.code = code
    self.message = message
    self.method = method
    self.param = param

  def __str__(self) :
    return self.__repr__()

  def __repr__(self) :
    return '[%s] %s when %s called with %s' % (self.code, self.message, self.method, self.param)

class BookmarkHandler(ContentHandler):
  bookmarks = []
  bookmark = None
  tmp = ''
  status = 'success'
  error = {'message': None, 'code': None}
  method = ''
  param = {}
  def __init__(self, method='', param={}):
    self.bookmarks = []
    self.bookmark = Bookmark()
    self.tmp = ''
    self.method = method
    self.param = param
  def startElement(self, name, attrs):
    if DEBUG :
      print ''
      print 'DEBUG: %s.startElement->%s' % (self.__class__, name)
      for key, value in attrs.items():
        print '     :%s->%s' % (key.encode('utf8'), value.encode('utf8'))
    self.tmp = ''
    if name.encode('utf8') == 'bookmark' :
      private = False
      if xmltoUtf(attrs, 'private') == 'true' :
        private = True
      self.bookmark = Bookmark(xmltoUtf(attrs, 'created'),
                               private,
                               xmltoUtf(attrs, 'updated'),
                               xmltoUtf(attrs, 'id'),
                               xmltoUtf(attrs, 'rating'),
                               xmltoUtf(attrs, 'owner'))
      self.bookmarks += [self.bookmark]
    elif name.encode('utf8') == 'tags' :
      self.bookmark['tags'] = []
    elif name.encode('utf8') == 'tag' :
      self.bookmark['tags'] += [attrs.get('name').encode('utf8')]
    elif name.encode('utf8') == 'response' :
      self.status = xmltoUtf(attrs, 'message')
      self.version = xmltoUtf(attrs, 'version')
    elif name.encode('utf8') == 'error' :
      self.error['message'] = xmltoUtf(attrs, 'message')
      self.error['code']    = xmltoUtf(attrs, 'code')
      raise PyMagnoliaError(self.error['code'], self.error['message'], self.method, self.param)
    return
  def endElement(self, name):
    if name.encode('utf8') == 'title' :
      self.bookmark['title'] = self.tmp
    elif name.encode('utf8') == 'url' :
      self.bookmark['url'] = self.tmp
    elif name.encode('utf8') == 'description' :
      self.bookmark['description'] = self.tmp
    elif name.encode('utf8') == 'screenshot' :
      self.bookmark['screenshot'] = self.tmp
    return
  def characters(self, content):
    self.tmp += content.encode('utf8')
    return

class MagnoliaApi :
  key = ''
  user = ''
  password = ''
  headers = {"Content-type": "application/x-www-form-urlencoded",
             "Accept"      : "text/plain",
             "User-agent"  : "pymagnolia/%s" % (VERSION)}
  server = 'ma.gnolia.com:80'

  def __init__(self, key='') :
    self.key = key

  def set_key(self, key='') :
    self.key = key

  def bookmarks_find(self, tags='', person='', group='',
                           rating=None, date_from=None, date_to=None,
                           url='', limit=None,) :
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_find')

  def bookmarks_get(self, id=''):
    if id == None or len(id) == 0:
      raise ValueError, 'id must be specified.'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_get')

  def bookmark_add(self, title='', description='',url='',
                         private='false', tags='', rating='0'):
    if url == None or len(url) == 0:
      raise ValueError, 'url must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_add')

  def bookmark_update(self, id='', title='', description='',url='',
                         private='false', tags='', rating='0'):
    if id == None or len(id) == 0:
      raise ValueError, 'bookmarks(shortname) must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_update')

  def bookmarks_delete(self, id=''):
    if id == None or len(id) == 0:
      raise ValueError, 'id must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_delete')

  def bookmarks_tags_add(self, id='', tags='') :
    if id == None or len(id) == 0:
      raise ValueError, 'named(shortname) must specified'
    if tags == None or len(tags) == 0:
      raise ValueError, 'tags must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_tags_add')

  def bookmarks_tags_delete(self, id='all', tags=''):
    if id == None or len(id) == 0:
      id = 'all'
    if tags == None or len(tags) == 0:
      raise ValueError, 'tags must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_tags_delete')

  def bookmarks_tags_rename(self, id='all', old='', new=''):
    if id == None or len(id) == 0:
      id = 'all'
    if old == None or len(old) == 0:
      raise ValueError, 'old(tags) must specified'
    if new == None or len(new) == 0:
      raise ValueError, 'new(tags) must specified'
    return self._handle_bookmark(parametalize(locals()), 'bookmarks_tags_replace')

  def _handle_bookmark(self, param={}, method='echo') :
    param['api_key'] = self.key
    if DEBUG :
      print 'DEBUG: %s._handle_bookmark->%s' % (self.__class__, method)
      print '     :%s' % (param)
      print ''
    xml.sax.make_parser(['drv_libxml2'])
    params = urllib.urlencode(param)
    conn = httplib.HTTPConnection(self.server)
    conn.request("POST", "/api/rest/%s/%s" % (API_VERSION, method), params, self.headers)
    response = conn.getresponse()
    parser = xml.sax.make_parser()
    handler = BookmarkHandler(method, param)
    parser.setContentHandler(handler)
    parser.parse(response)
    conn.close()
    return handler.bookmarks

    

if __name__ == '__main__' :
  api = MagnoliaApi('your api key here')
  try :
    bookmarks = api.bookmarks_get(id='cushiw')
    #bookmarks = api.bookmarks_find(person='myself', date_from='2006/05/10T12:00:00Z', limit=10)
    #bookmarks = api.bookmark_add(title='WorkStyle-py',
    #                             description='GTD Web Application. WorkStyle with python(Django)',
    #                             url='http://workstyle-py.sourceforge.net',
    #                             tags='django',
    #                             rating='4')
    #bookmarks = api.bookmark_update(bookmarks='cushiw', title='Setting up Django on Dreamhost',
    #                             description='A simple how-to guide for setting up Django on your Dreamhost server.',
    #                             url='http://www2.jeffcroft.com/2006/may/11/django-dreamhost/',
    #                             tags='django,tips,howto',
    #                             rating='4')
    #bookmarks = api.bookmarks_tags_add(bookmarks='heranulith', tags='test') #Not Enough Parameter
    #bookmarks = api.bookmarks_tags_rename(named='http://ma.gnolia.com/heranulith', old='tips', new='code')  #Not Enough Parameter
    #bookmarks = api.bookmarks_delete(id='cluqihush') #OK
    #bookmarks = api.bookmarks_tags_rename(named='dresage', old='imported', new='test2'):
    #bookmarks = api.bookmarks_tags_delete(named='dresage', tags='imported') #Method not found
  except PyMagnoliaError, e:
    print 'Error: %s' % e.message
    print '  code : %s' % e.code
    print '  method : %s' % e.method
    for key, value in e.param.iteritems() :
      print '  param : %s->%s' % (key, value)
  else :
    if DEBUG :
      c = 0
      for b in bookmarks :
        c += 1
        print '%03d:%s' % (c, b['title'])
        print '   :%s ( %s )' % (b['url'], b['screenshot'])
        print '   :%s' % b['tags']
        print ''
