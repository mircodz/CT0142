FROM node:latest AS build

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .

RUN yarn build

FROM nginx:latest
COPY --from=build /usr/local/app/dist/battleship /usr/share/nginx/html

EXPOSE 80
