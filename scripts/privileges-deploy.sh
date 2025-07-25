#!/bin/bash

NGINX_USER_ID=1234
NGINX_GROUP_ID=1234

# Nginx For Gateway
GATEWAY_NGINX_LOGS_DIR="./docker/gateway/nginx/logs"
chown -R $NGINX_USER_ID:$NGINX_GROUP_ID $GATEWAY_NGINX_LOGS_DIR

# Nginx For Gateway
REACT_NGINX_LOGS_DIR="./docker/serp-react/nginx/logs"
chown -R $NGINX_USER_ID:$NGINX_GROUP_ID $REACT_NGINX_LOGS_DIR
