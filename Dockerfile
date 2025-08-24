# Dockerfile for NEXUS-BATTLE-IV Node.js project
# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE 3000

# Start the application (adjust if your entry point is different)
CMD ["npm", "run", "dev"]
