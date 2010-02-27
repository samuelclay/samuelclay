from syncr.flickr.models import Photo
from datetime import datetime

def get_unique_slug_for_photo(taken_date, proposed_slug):
    l=1
    calculate_slug = proposed_slug
    while check_slug_photo(taken_date, proposed_slug):
        proposed_slug = calculate_slug + '-' + str(l)
        l = l+1
    return proposed_slug

def check_slug_photo(taken_date, proposed_slug):
    if Photo.objects.filter(taken_date__year=taken_date.year, taken_date__month=taken_date.month, taken_date__day=taken_date.day).filter(slug=proposed_slug):
        return True
    else:
        return False