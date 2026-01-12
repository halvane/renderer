import { renderVideo as renderVideoLib } from '@revideo/renderer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

// Configure Puppeteer for Docker environment
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_ARGS = '--no-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --disable-default-apps --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-crash-reporter --disable-breakpad --enable-experimental-web-platform-features --enable-features=WebCodecs,SharedArrayBuffer --disable-background-media-download --disable-hang-monitor --disable-prompt-on-repost --memory-pressure-off --use-gl=swiftshader --enable-accelerated-video-decode --allow-running-insecure-content --disable-web-security --disable-features=VizDisplayCompositor --disable-blink-features=AutomationControlled --disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees --enable-logging=stderr --v=1';

interface RenderInput {
    variables?: Record<string, any>;
    outputFileName?: string;
}

interface RunPodRequest {
    input: RenderInput;
    id: string;
}

interface RunPodResponse {
    output?: any;
    error?: string;
    status?: string;
}

async function renderVideo(input: RenderInput): Promise<any> {
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}`;

    console.log("🚀 Starting render job with input:", JSON.stringify(input));

    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const projectFile = path.resolve('./src/project.ts');
        console.log(`Rendering project: ${projectFile}`);

        // Try CLI approach with better error handling
        const cliPromise = new Promise((resolve, reject) => {
            const cliProcess = spawn('npx', [
                'revideo', 'render', 
                projectFile,
                '--out-dir', outputDir,
                '--out-file', `${outputFileName}.mp4`,
                '--fast',
                '--verbose'
            ], {
                stdio: 'inherit',
                env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
            });

            let outputPath = '';

            cliProcess.on('close', (code) => {
                if (code === 0) {
                    outputPath = path.join(outputDir, `${outputFileName}.mp4`);
                    resolve(outputPath);
                } else {
                    reject(new Error(`CLI process exited with code ${code}`));
                }
            });

            cliProcess.on('error', (err) => {
                reject(err);
            });

            // Timeout after 4 minutes
            setTimeout(() => {
                cliProcess.kill('SIGTERM');
                reject(new Error('CLI render timeout'));
            }, 240000);
        });

        const outputPath = await cliPromise as string;

        console.log("✅ Render complete:", outputPath);

        return {
            status: 'completed',
            message: 'Video rendered successfully',
            output_path: outputPath,
            output_url: `/output/${path.basename(outputPath)}`,
            file_size: fs.statSync(outputPath).size
        };

    } catch (err: any) {
        console.error("❌ Render error:", err);
        return {
            status: 'failed',
            error: err.message || String(err)
        };
    }
}

// Create HTTP server to handle RunPod requests
const server = http.createServer(async (req, res) => {
    // Serve static files from output directory
    if (req.method === 'GET' && req.url?.startsWith('/output/')) {
        const fileName = req.url.replace('/output/', '');
        // Validate filename to prevent directory traversal
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
             res.writeHead(403);
             res.end('Forbidden');
             return;
        }

        const filePath = path.join(path.resolve('output'), fileName);
        
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': stat.size
            });
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
            return;
        } else {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
    }

    if (req.method === 'POST' && req.url === '/') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const runpodRequest: RunPodRequest = JSON.parse(body);
                console.log('Received RunPod request:', runpodRequest.id);

                const result = await renderVideo(runpodRequest.input);

                const response: RunPodResponse = {
                    output: result,
                    status: result.status
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));

            } catch (error: any) {
                console.error('Request processing error:', error);
                const errorResponse: RunPodResponse = {
                    error: error.message,
                    status: 'failed'
                };
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(errorResponse));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 8000;
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Revideo renderer listening on port ${PORT}`);
});
