FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose port (default 5000)
EXPOSE 5000

# Start command
CMD ["npm", "start"]
