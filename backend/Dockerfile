FROM node:latest

WORKDIR /usr/src/app

COPY package.json ./
RUN yarn install
RUN npm install socketio-jwt
COPY . .

EXPOSE 6969

RUN yarn tsc *.ts


CMD [ "node", "-r", "app.js" ]
CMD ["node","app"]
