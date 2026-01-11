# Revideo Serverless Renderer

This is a standalone renderer service designed for RunPod Serverless.

## Deploying to RunPod

### 1. Initialize Git & Push

You need to push this code to your GitHub repository to use the "Deploy from Repo" feature.

```bash
cd revideo-renderer
git init
git remote add origin https://github.com/halvane/renderer.git
git add .
git commit -m "Initial commit of Revideo Renderer"
git branch -M main
git push -u origin main
```

### 2. Connect RunPod to GitHub

1. Go to [RunPod Console](https://www.runpod.io/console/serverless)
2. Click **New Endpoint**
3. Select **Deploy from Repo** (or connect GitHub)
4. Choose the repository `halvane/renderer`
5. RunPod will detect the `Dockerfile` automatically.

### Configuration

Set the global environment variables in RunPod (optional):
- `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/chromium` (Already set in Dockerfile)

### Testing locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Start worker (requires RUNPOD_API_KEY environment variable if testing against real job queue locally, 
# otherwise use test script)
npm start
```

## Structure

- `src/handler.ts`: Entry point for RunPod jobs.
- `src/project.ts`: Revideo project configuration.
- `src/scenes/`: Animation scenes (edit `example.tsx` or add new ones).
