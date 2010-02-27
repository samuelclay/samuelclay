from syncr.genericfeed.models import Feed, Entry
import feedparser
from datetime import datetime
import time

class GenericFeedSyncr:
    """This class uses feedparser to synchronize simple Atom and RSS feeds."""
    def __init__(self, url):
        """Construct a new Generic Feed Syncr object.
        
        Required arguments
            url: The url of the RSS or Atom feed to synchronize
        """
        self.url = url
    
    def sync_feed(self):
        """Use feedparser to populate the models."""
        source = feedparser.parse(self.url)
        
        # Check to make sure the feed is valid
        if not source.bozo:
            # Process the feed itseld
            feed_link = source.feed.get('link', self.url)
            feed_id = source.feed.get('id', feed_link)
            
            try:
                # If the feed already exists, check to see if any details have
                # changed
                feed = Feed.objects.get(id=feed_id)
                feed.title = source.feed.get('title', 'No Title')
                
            except Feed.DoesNotExist:
                # If this is a new feed, create a new Feed item
                feed = Feed(id=feed_id,
                            title=source.feed.get('title', 'No Title'),
                            link=feed_link)
            
            for field in ('subtitle', 'version'):
                if source.feed.has_key(field):
                    setattr(feed, field, source.feed[field])
            
            feed.save()
            
            # Process the feed entries
            for source_entry in source.entries:
                entry_id = source_entry.get('id', source_entry.link)
                
                if source_entry.has_key('content'):
                    source_content = source_entry.content[0]['value']
                else:
                    source_content = False
                
                if source_entry.has_key('summary'):
                    source_summary = source_entry.summary
                else:
                    source_summary = False
                
                try:
                    # If this is an existing entry, look for changes
                    entry = Entry.objects.get(id=entry_id)
                    
                    if entry.title != source_entry.get('title', 'No Title'):
                        entry.title = source_entry.get('title', 'No Title')
                    
                except Entry.DoesNotExist:
                    # If this is a new entry, create a new Entry item
                    entry = Entry(id=entry_id,
                                  title=source_entry.get('title', 'No Title'),
                                  link=source_entry.link)
                    
                for field in ('author', 'summary'):
                    if source_entry.has_key(field):
                        setattr(entry, field, source_entry[field])
                
                for field in ('published', 'updated'):
                    field_key = '%s_parsed' % field
                    if source_entry.has_key(field_key):
                        setattr(entry, field,
                                datetime.fromtimestamp(
                                    time.mktime(source_entry[field_key])))
                    
                entry.feed = feed
                
                if source_content:
                    entry.content = source_content
                
                if source_summary:
                    entry.summary = source_summary
                    
                entry.save()
