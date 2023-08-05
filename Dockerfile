FROM alpine:latest AS node-alpine

RUN apk add bash openrc nodejs npm

WORKDIR /cluedo

COPY ./package*.json /cluedo

COPY ./*tsconfig.json /cluedo

COPY ./@types /cluedo/@types

COPY ./libs /cluedo/libs

FROM node-alpine AS node-mongo-alpine

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/main' >> /etc/apk/repositories

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories

RUN apk update

RUN apk add mongodb mongodb-tools

RUN rc-update add mongodb default

VOLUME ["/data/db"]

VOLUME ["/var/log/"]

EXPOSE 27017

FROM node-alpine AS discovery

WORKDIR /cluedo/discovery

COPY ./discovery /cluedo/discovery

WORKDIR /cluedo

RUN npm install

COPY ./discovery.entrypoint.sh /cluedo

RUN npm run build

EXPOSE 3000

CMD [ "/cluedo/discovery.entrypoint.sh"]

FROM node-mongo-alpine AS peer

WORKDIR /cluedo/peer

COPY ./peer /cluedo/peer

WORKDIR /cluedo

RUN npm install

RUN npm run install:peer-ui

COPY ./peer.entrypoint.sh /cluedo

RUN npm run build

EXPOSE 3001

ENTRYPOINT [ "/cluedo/peer.entrypoint.sh" ]
