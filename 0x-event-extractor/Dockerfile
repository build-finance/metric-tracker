FROM node:10.16.3-alpine
RUN apk add --update alpine-sdk
RUN apk add --no-cache git
RUN apk add --no-cache python
WORKDIR /usr/app
COPY . .
RUN yarn install --quiet --ignore-engines; exit 0;
