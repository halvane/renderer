# Revideo Renderer - Test Scripts

This directory contains several scripts to test the Revideo Renderer while running the server.

## Quick Start

### Option 1: Node.js (Recommended for All Platforms)

```bash
npm run build    # Build the TypeScript
npm run test     # Start server and run test
```

Or directly:
```bash
npm install
npm run build
node test-and-serve.js
```

### Option 2: PowerShell (Windows)

```powershell
npm run build
.\test-and-serve.ps1
```

### Option 3: Bash (Linux/macOS)

```bash
npm run build
chmod +x test-and-serve.sh
./test-and-serve.sh
```

## Available npm Scripts

```bash
npm run start         # Start server (background mode)
npm run build         # Compile TypeScript
npm run dev           # Development mode with hot reload
npm run test          # Start server + run test in Node.js
npm run test:health   # Check server health
npm run test:request  # Send a render request via curl
```

## Manual Testing

If you want to start the server separately and test it manually:

### Terminal 1 - Start Server
```bash
npm run start
# or
npm run dev
```

### Terminal 2 - Test Health
```bash
npm run test:health
# Output: {"status":"ok"}
```

### Terminal 2 - Send Render Request
```bash
npm run test:request
```

Or with curl directly:
```bash
curl -X POST http://localhost:8000/render \
  -H "Content-Type: application/json" \
  -d '{"input": {"variables": {"headline": "My Test"}}}'
```

## What the Test Scripts Do

1. **Start the server** on port 8000
2. **Wait for server readiness** (max 60 seconds)
3. **Send a test render request** with sample variables
4. **Display results:**
   - ✅ Render succeeded - shows output path and file size
   - ❌ Render failed - shows error message and stack trace
5. **Keep server running** for further testing (Ctrl+C to stop)

## Example Output

```
🚀 Starting Revideo Renderer Server...

⏳ Waiting for server to start...
..✅ Server is ready!

🎬 Sending render request...
✅ Render succeeded!
📁 Output: /app/output/output-1736222573741.mp4
📊 File size: 1234567 bytes
🌐 URL: /output/output-1736222573741.mp4

═══════════════════════════════════════════

ℹ️ Server is still running on port 8000
ℹ️ Press Ctrl+C to stop
```

## Troubleshooting

### Server won't start
- Make sure Node.js v20+ is installed
- Check that port 8000 is not in use: `lsof -i :8000`
- Try: `npm run build` first to compile TypeScript

### Render hangs or times out
- Check Docker logs if running in container
- Verify Chromium/FFmpeg is installed
- Check available disk space in output directory

### Port already in use
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port
PORT=9000 node test-and-serve.js
```

## Environment Variables

- `PORT` - Server port (default: 8000)
- `NODE_OPTIONS` - Node.js memory options (default: --max-old-space-size=4096)

Example:
```bash
PORT=9000 npm run test
NODE_OPTIONS="--max-old-space-size=8192" npm run start
```
