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

# Copy package files first for caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Start the handler
CMD ["node", "dist/handler.js"]