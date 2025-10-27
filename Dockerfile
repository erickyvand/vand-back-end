# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock files to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN npm run build

# Run migrations
RUN npm run db:migrate

# Run seeds
RUN npm run db:seed

# Expose port 3000 to the outside world
ENV PORT=${PORT}
EXPOSE ${PORT}

# Command to run the application
CMD ["npm", "start"]
