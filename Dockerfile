FROM node:20.13-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

RUN mkdir data

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run your bot
CMD ["npm", "run", "prod"]
