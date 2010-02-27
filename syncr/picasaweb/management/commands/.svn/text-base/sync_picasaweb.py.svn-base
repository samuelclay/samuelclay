"""
Todo:
- add quiet command
- add ability to sync specific album
- add sync recent

"""

from django.core.management.base import BaseCommand, CommandError
from optparse import make_option
import getpass

class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
	make_option('--username', '-u', action='store', dest='username',
		    help='Google account username'),
	make_option('--password', '-p', action='store', dest='password',
		    help='Google account password'),
    )

    help = "Sync picasaweb information for given username and password."
    args = "[picasaweb username] [picasaweb albumname]"
    
    requires_model_validation = True
    
    def handle(self, *args, **options):
	if len(args) > 2:
            raise CommandError("need zero, one or two arguments. Optional arguments are [user-to-sync] [album-to-sync]")

	from syncr.app.picasaweb import PicasawebSyncr
	
	username = options.get('username', None)
	password = options.get('password', None)
	
	if not username:
	    username = raw_input("Username: ")
	if username=="" or len(username)<3:
	    raise CommandError("invalid username")
	
	if not password:
	    password = getpass.getpass()
	
	picasaweb_user = username
	picasaweb_album = None
	if len(args)==1:
	    picasaweb_user, = args
	elif len(args)==2:
	    picasaweb_user, picasaweb_album = args
	
	print "Updating picasaweb for %s" % username
	ps = PicasawebSyncr(username, password, cli_verbose=1)
	if picasaweb_album is not None:
	    ps.syncAlbum(picasaweb_album, username=picasaweb_user)
	else:
	    ps.syncAllAlbums(username=picasaweb_user)
	
	