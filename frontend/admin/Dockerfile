# 1. Build-Phase
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# 2. Static-Serve
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80