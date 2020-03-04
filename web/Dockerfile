From nginx:1.17.5-alpine
COPY ./nginx_conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh
COPY ./nginx_conf/nginx.tpl /etc/nginx/nginx.tpl
COPY ./html/ /usr/share/nginx/html/
ENV PORT 80
ENV APP_SERVER "http://127.0.0.1:8080"
CMD ["/usr/local/bin/start.sh"]