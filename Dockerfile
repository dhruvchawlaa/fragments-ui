# Stage 0: Base image to use for the microservice image.
# We include the exact version to replicate the dev environment.
FROM node:20-alpine@sha256:df01469346db2bf1cfc1f7261aeab86b2960efa840fe2bd46d83ff339f463665 AS base

# Metadata about the image
LABEL maintainer="Dhruv Chawla <dchawla3@myseneca.ca>"
LABEL description="Fragments microservice front-end"

# Default to port 80 in our service
ENV PORT=80

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable color when run inside Docker
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json files into /app
COPY package*.json ./

# Install node dependencies defined in package-lock.json
RUN npm ci

#-----------------------------------------------------------------------------------------------------------------------

# Stage 1: Build the application
FROM node:20-alpine@sha256:df01469346db2bf1cfc1f7261aeab86b2960efa840fe2bd46d83ff339f463665 AS build

# Use /app as our working directory
WORKDIR /app

# Copy node modules and package files from the base stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

#-----------------------------------------------------------------------------------------------------------------------

# Stage 2: Production stage on nginx
FROM nginx:stable-alpine3.19@sha256:208ae3c180b7d26f6a8046fac4c8468b2ab8bd92123ab73f9c5ad0f6f1c5543d AS deploy

# COPY items we need to run
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/.parcel-cache /usr/share/nginx/html

# Expose port 80
EXPOSE 80
