# Stage 1 - the build process
FROM node:16.20.2-alpine as build-deps

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package.json yarn.lock* /usr/src/app/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy only necessary source files
COPY public/ /usr/src/app/public/
COPY src/ /usr/src/app/src/
COPY jsconfig.json /usr/src/app/

# Change ownership to non-root user
RUN chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# For development - start the dev server
ENTRYPOINT [ "yarn", "start" ]

# Stage 2 - the production environment (uncomment for production builds)
# FROM nginx:1.21.6-alpine
# COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
# RUN addgroup -g 1001 -S appuser && \
#     adduser -S appuser -u 1001
# USER appuser
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]