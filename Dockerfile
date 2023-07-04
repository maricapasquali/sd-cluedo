FROM alpine:latest AS node-alpine

RUN apk add bash openrc nodejs npm

WORKDIR /cluedo

COPY ./package*.json /cluedo

COPY ./tsconfig.json /cluedo

COPY ./libs /cluedo/libs

FROM node-alpine AS node-mongo-alpine

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories

RUN apk add mongodb mongodb-tools

RUN rc-update add mongodb default

RUN mongo --version

VOLUME ["/data/db"]

VOLUME ["/var/log/"]

EXPOSE 27017

FROM node-alpine AS discovery

WORKDIR /cluedo/discovery

COPY ./discovery/package*.json /cluedo/discovery

COPY ./discovery/src /cluedo/discovery/src

WORKDIR /cluedo

RUN npm install

COPY ./discovery.entrypoint.sh /cluedo

EXPOSE 3000

ARG PORT

CMD [ "/cluedo/discovery.entrypoint.sh"]

FROM node-mongo-alpine AS peer

WORKDIR /cluedo/peer

COPY ./peer/package*.json /cluedo/peer

COPY ./peer/src /cluedo/peer/src

WORKDIR /cluedo

RUN npm install

COPY ./peer.entrypoint.sh /cluedo

EXPOSE 3001

ENTRYPOINT [ "/cluedo/peer.entrypoint.sh" ]
