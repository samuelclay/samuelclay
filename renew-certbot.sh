#!/bin/bash

# Restart the certbot container
docker restart samuelclay-certbot

# Wait for the certbot container to finish
docker wait samuelclay-certbot

# Restart the nginx container
docker restart samuelclay-nginx
