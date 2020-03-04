#!/bin/sh
sed -e "s/{{PORT}}/$PORT/g" /etc/nginx/nginx.tpl > /etc/nginx/nginx.conf
sed -i -e "s^{{APP_SERVER}}^$APP_SERVER^g" /etc/nginx/nginx.conf
exec nginx -g "daemon off;"