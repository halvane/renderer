# Use a more recent Debian base with updated Chromium
FROM node:20-bookworm-slim

# Install system dependencies for Puppeteer and FFmpeg
# Use bookworm for newer Chromium version
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
    libgbm1 \
    libxdamage1 \
    libxfixes3 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set Puppeteer env to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --disable-default-apps --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-crash-reporter --disable-breakpad --disable-logging --disable-component-extensions-with-background-pages --enable-experimental-web-platform-features --enable-features=WebCodecs,SharedArrayBuffer --disable-background-media-download --disable-hang-monitor --disable-prompt-on-repost --memory-pressure-off --use-gl=swiftshader --enable-accelerated-video-decode --allow-running-insecure-content --disable-web-security --disable-features=VizDisplayCompositor --disable-blink-features=AutomationControlled --disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees --enable-logging=stderr --v=1"
ENV CHROME_CRASHPAD_DATABASE=/tmp/chromium-crashpad
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV DISPLAY=:99

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