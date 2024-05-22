
# Use an official Node runtime as a parent image
FROM node:20.11.0 as build

# Install Java (OpenJDK) for the OpenAPI generator
RUN apt-get update && \
    apt-get install -y default-jre && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of your app's source code
COPY . /app

# Set the working directory in the container
WORKDIR /app

# Install any dependencies
RUN npm install

# Build the static files
RUN npm run build

# Use a specific version of nginx
FROM nginx:1.25

# Copy the static content from the previous build stage to the html directory served by Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Remove the default configuration file that comes with nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom nginx configuration file
COPY ./nginx.conf /etc/nginx/conf.d

# Expose port 80 to the outside world
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
