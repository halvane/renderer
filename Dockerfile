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
ENV PUPPETEER_ARGS="--no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer --disable-background-networking --disable-default-apps --disable-sync --disable-translate --hide-scrollbars --metrics-recording-only --mute-audio --no-first-run --safebrowsing-disable-auto-update --single-process --disable-crash-reporter --disable-breakpad --disable-logging --disable-component-extensions-with-background-pages --disable-features=VizDisplayCompositor --disable-web-security --disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer"
ENV CHROME_CRASHPAD_DATABASE=/tmp/chromium-crashpad

# Copy package files first for caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Create non-root user for running the app
RUN useradd -r -s /bin/false renderer
RUN mkdir -p /home/renderer && chown -R renderer:renderer /home/renderer /app

# Create Chromium crash dump directory
RUN mkdir -p /tmp/chromium-crashpad && chown -R renderer:renderer /tmp/chromium-crashpad

USER renderer

# Start the handler
CMD ["node", "dist/handler.js"]