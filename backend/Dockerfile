FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Pre-generate Prisma client during build time so container boots in 1 second
RUN npx prisma generate

# Expose port (default 5000)
EXPOSE 5000

# Start command: Launch node directly for proper PID 1 signal forwarding
CMD ["node", "--import", "./instrument.js", "index.js"]
