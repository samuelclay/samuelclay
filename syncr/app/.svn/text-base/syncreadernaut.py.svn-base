from readernaut.models import Book
import time, datetime
import urllib, dateutil.parser, dateutil.tz, feedparser
from xml2dict import XML2Dict
from django.conf import settings
 

def syncbooks(pagenum):
    """
    Phrases the url to fetch from and them parse the XML data using xml2dict (http://code.google.com/p/xml2dict/)
    Apparently I am lazy to parse XML. Feel free to use your own way. For each book I check if it has one or more 
    authors and then append it into one single string. Again feel free to make a model for author and add a foreign key
    based on your requirement.
    
    I am using dateutil to parse the date in string format into a python datetime object. Check if the book exists
    if it does n't add it to Book model.
    """
    url1 = "http://readernaut.com/api/v1/xml/"+ settings.READERNAUT_USERNAME + "/books/?page=" + str(pagenum)
    data1 = urllib.urlopen(url1).read()
    x1 = XML2Dict()
    r1 = x1.fromstring(data1)
    for book in r1["reader_books"]["reader_book"]:
        authors =[]
        if len(book['book_edition']['authors']['author']) > 1:
            for auth in book['book_edition']['authors']['author']:
                authors.append(auth["value"])
            author = ', '.join(authors)
        else:
            author = book['book_edition']['authors']['author']['value']
        pub_time = dateutil.parser.parse(book['created']['value'])
        if pub_time.tzinfo:
            pub_time = pub_time.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
        modified = dateutil.parser.parse(book['modified']['value'])
        if modified.tzinfo:
            modified = modified.astimezone(dateutil.tz.tzlocal()).replace(tzinfo=None)
        try:
            r_book = Book.objects.get(book_id = book["reader_book_id"]["value"])
        except Book.DoesNotExist:
            new_book = Book(book_id=int(book["reader_book_id"]["value"]), author=author, title=book['book_edition']['title']["value"], isbn=book['book_edition']['isbn']["value"], cover_small=book['book_edition']['covers']['cover_small']["value"], cover_medium=book['book_edition']['covers']['cover_medium']["value"], cover_large=book['book_edition']['covers']['cover_large']["value"], permalink=book['book_edition']['permalink']["value"], modified=modified, created=pub_time)
            new_book.save()


class BookSyncr:
    def readernautsyncr(self):
        """
        First checking to know how many pages exist for a readernaut user. Append each pagenumber as 
        an argument to 'syncbooks' which actually does the syncing.
        """
        url = "http://readernaut.com/api/v1/xml/"+settings.READERNAUT_USERNAME+"/books/"
        data = urllib.urlopen(url).read()
        x = XML2Dict()
        r = x.fromstring(data)
        page_range = int(r['reader_books']['total_pages']['value'])
        for a in range(page_range):
            syncbooks(a+1)   