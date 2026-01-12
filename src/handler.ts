import { renderVideo as renderVideoLib } from '@revideo/renderer';
import path from 'path';
import fs from 'fs';
import http from 'http';

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
        
        // Verify project can be imported
        console.log('🔍 Importing project...');
        const project = await import(projectFile);
        console.log('✅ Project imported successfully:', typeof project, project.default ? 'has default export' : 'no default export');
        
        console.log(`🔍 Starting renderVideoLib...`);

        // Wrap renderVideoLib with detailed logging
        let renderStarted = false;
        let renderCompleted = false;

        const renderPromise = (async () => {
            try {
                console.log('📹 Calling renderVideoLib...');
                renderStarted = true;
                
                const result = await renderVideoLib({
                    projectFile: projectFile,
                    variables: variables
                });
                
                renderCompleted = true;
                console.log('✅ renderVideoLib returned:', result);
                return result;
            } catch (error) {
                console.error('❌ renderVideoLib threw error:', error);
                throw error;
            }
        })();

        // Monitor progress
        const progressInterval = setInterval(() => {
            if (renderStarted && !renderCompleted) {
                console.log('⏳ Still rendering...');
            }
        }, 10000); // Log every 10 seconds

        try {
            console.log('⏳ Waiting for render to complete (2 min timeout)...');
            
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    console.error('⏱️ TIMEOUT: Render exceeded 2 minutes!');
                    console.error('renderStarted:', renderStarted, 'renderCompleted:', renderCompleted);
                    reject(new Error('Render timeout after 2 minutes'));
                }, 120000);
            });

            const outputPath = await Promise.race([renderPromise, timeoutPromise]);
            clearInterval(progressInterval);

            console.log("✅ Render complete:", outputPath);

            if (!fs.existsSync(outputPath)) {
                throw new Error(`Output file not created: ${outputPath}`);
            }

            const fileSize = fs.statSync(outputPath).size;
            console.log(`📊 Output file size: ${fileSize} bytes`);

            return {
                status: 'completed',
                message: 'Video rendered successfully',
                output_path: outputPath,
                output_url: `/output/${path.basename(outputPath)}`,
                file_size: fileSize
            };
        } catch (timeoutError) {
            clearInterval(progressInterval);
            throw timeoutError;
        }

    } catch (err: any) {
        console.error("❌ Render error:", err.message || err);
        console.error("Stack trace:", err.stack);
        return {
            status: 'failed',
            error: err.message || String(err),
            error_stack: err.stack
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
