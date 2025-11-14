FROM node:20-alpine

WORKDIR /app

# Install expo-cli globally
RUN npm install -g expo-cli

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --prefer-offline --no-audit

# Copy the entire app
COPY . .

# Expose Metro bundler default port
EXPOSE 8081

# Start Expo with explicit hostname for LAN connection
# The REACT_NATIVE_PACKAGER_HOSTNAME environment variable tells Expo which IP to advertise
CMD ["sh", "-c", "npm start -- --lan 2>&1 || npm start -- --clear"]
