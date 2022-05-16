FROM node:latest

WORKDIR /usr/src/app

COPY package.json ./
RUN yarn install

COPY . .

EXPOSE 6969

RUN yarn tsc *.ts

CMD [ "node", "-r", "./tracing.js", "app.js" ]
