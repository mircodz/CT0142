FROM node:latest

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .

RUN yarn tsc *.ts

EXPOSE 6969

CMD [ "node", "dist/app.js" ]
