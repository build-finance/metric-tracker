FROM node:12.19.0-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .
