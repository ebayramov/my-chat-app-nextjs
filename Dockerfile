# FROM node:18.17.0-alpine

# # Set the working directory
# WORKDIR /app

# # Copy package.json and package-lock.json to the container
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application code
# COPY . .

# # Build the Next.js app for production
# RUN npm run build

# # Expose the port the app runs on
# EXPOSE 3000

# # Run the app in production mode
# CMD ["npm", "run", "start"]


# FROM node:18.17.0-alpine

# # Set the working directory
# WORKDIR /app

# # Copy package.json and package-lock.json to the container
# COPY package*.json ./

# # Install app dependencies
# RUN npm install

# # Bundle app source
# COPY . .

# # Expose the port the app runs on
# EXPOSE 3000

# # Start the application using nodemon
# CMD ["npm", "run", "dev"]


# Use the official Node.js image
FROM node:18.17.0-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port that Railway will use (Railway expects to assign a port dynamically)
EXPOSE 3000

# Start the application, dynamically using the PORT environment variable, falling back to port 3000
CMD ["sh", "-c", "npm run start -p ${PORT:-3000}"]

