import psutil
import math

GIGS_OF_MEMORY = psutil.TOTAL_PHYMEM/1024/1024/1024.
NUM_CPUS = psutil.NUM_CPUS

bind = "0.0.0.0:3000"
pidfile = "/srv/samuelclay/logs/gunicorn.pid"
logfile = "/srv/samuelclay/logs/production.log"
accesslog = "/srv/samuelclay/logs/production.log"
errorlog = "/srv/samuelclay/logs/errors.log"
loglevel = "debug"
name = "samuelclay"
timeout = 120
max_requests = 1000
x_forwarded_for_header = "X-FORWARDED-FOR"
forwarded_allow_ips = "*"
limit_request_line = 16000
limit_request_fields = 1000
workers = 2