This is a simple static page built with Django. It displays:
* Recent Twitter status messages, with messages that start with @'s removed. In other words, no replies, only true messages.
* Recent posts from a feed URL

I built it for http://www.samuelclay.com, but it can be used to power any static pages and can serve as a useful template for starting a site with static media (JavaScript, CSS, HTML, etc).

= Dependencies =

# Django: `easy_install django`
# Mark Pilgrim's Feedparser: `easy_install feedparser`
# Python-Twitter: `easy_install python-twitter`