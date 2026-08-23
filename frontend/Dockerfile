# --- Stage 1: Development & Builder ---
FROM node:20-slim AS development

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite server, bound to all network interfaces so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]


# --- Stage 2: Production Builder ---
# (We reuse the development stage to actually build the code)
FROM development AS builder
RUN npm run build


# --- Stage 3: Production Nginx Server ---
FROM nginx:alpine AS production

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite default Nginx config to support React Router (fallback to index.html for unknown routes)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
