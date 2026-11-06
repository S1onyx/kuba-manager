FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_ADMIN_SESSION_KEY=kuba-admin-session

ENV VITE_ADMIN_SESSION_KEY=$VITE_ADMIN_SESSION_KEY

# Install dependencies and build with cached layers
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
