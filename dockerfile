# Use Node.js as base image
FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of your application
COPY . .

# Build the Next.js app
RUN pnpm build

# Expose the port your app runs on
EXPOSE 3000

# Command to run the app
CMD ["pnpm", "start"]