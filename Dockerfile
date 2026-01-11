# RunPod Serverless Dockerfile for Revideo
FROM node:20-bullseye-slim

# Install system dependencies for Puppeteer and FFmpeg
# We use bullseye-slim for smaller size but install necessary libs
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set Puppeteer env to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files
COPY package.json ./
# COPY package-lock.json ./ # If you have one

# Install dependencies
RUN npm install

# Install runpod globally
RUN npm install -g runpod

# Try to install Revideo packages that were working in the original project
RUN npm install -g @revideo/cli@0.10.3 @revideo/2d@^0.10.4 @revideo/core@^0.10.4 || echo "Some Revideo packages may not be available, will use npx fallback"

# Copy source code
COPY vite.config.ts tsconfig.json ./
COPY src ./src

# Build the project (compile TS)
RUN npm run build

# Start the handler
CMD ["npm", "start"]
