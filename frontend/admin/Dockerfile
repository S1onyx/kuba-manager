FROM node:20 AS builder
WORKDIR /app

ARG VITE_ADMIN_USERNAME=admin
ARG VITE_ADMIN_PASSWORD=kuba-manager
ARG VITE_ADMIN_SESSION_KEY=kuba-admin-session

ENV VITE_ADMIN_USERNAME=$VITE_ADMIN_USERNAME
ENV VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD
ENV VITE_ADMIN_SESSION_KEY=$VITE_ADMIN_SESSION_KEY

# Install dependencies and build with cached layers
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
