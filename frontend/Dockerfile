# Stage 1 - the build process
FROM node:16 as build-deps
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN yarn
COPY . ./
ENTRYPOINT [ "yarn", "start" ]
# RUN npm run build

# Stage 2 - the production environment
# FROM nginx:1.12
# COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]