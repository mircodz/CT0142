FROM node:latest as build
WORKDIR /usr/local/app
COPY ./ /usr/local/app/
RUN yarn install
RUN yarn build


FROM nginx:latest
COPY --from=build /usr/local/app/dist/c4 /usr/share/nginx/html




EXPOSE 80
