FROM node:20 AS builder
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Build the production bundle
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
