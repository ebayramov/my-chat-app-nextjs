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


FROM node:18.17.0-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application using nodemon
CMD ["nodemon", "--watch", ".", "--exec", "npm", "run", "dev"]