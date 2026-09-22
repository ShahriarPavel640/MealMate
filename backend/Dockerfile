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

# Build TypeScript to dist/
RUN npm run build

# Expose port (default 5000)
EXPOSE 5000

# Start command: Launch compiled Node.js backend directly
CMD ["node", "--import", "./dist/instrument.js", "dist/index.js"]
