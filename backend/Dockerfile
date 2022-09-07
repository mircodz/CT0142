FROM node:latest

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .

EXPOSE 6969

CMD [ "yarn", "tsx", "app.ts" ]
