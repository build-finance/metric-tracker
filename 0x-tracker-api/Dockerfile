FROM node:15.9.0-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .