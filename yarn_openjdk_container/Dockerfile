FROM node:alpine3.12

RUN apk update \
  && apk --no-cache add openjdk11-jre-headless \
  && rm -rf /var/cache/apk/*

CMD /bin/sh
