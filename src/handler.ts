import { renderVideo as renderVideoLib } from '@revideo/renderer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

async function renderVideoCLI(input: RenderInput): Promise<any> {
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}`;

    console.log("🎬 Starting CLI-based render job with input:", JSON.stringify(input));

    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const projectFile = path.resolve('./src/project.ts');
        const outputPath = path.join(outputDir, `${outputFileName}.mp4`);

        console.log(`🎭 Starting Revideo serve process for project: ${projectFile}`);

        // Start the revideo serve process
        const serveProcess = spawn('npx', ['@revideo/cli', 'serve', projectFile, '--port', '3001'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
        });

        let serveReady = false;
        let renderRequested = false;

        // Handle serve process output
        serveProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('📺 Serve stdout:', output);

            if (output.includes('Server started') || output.includes('listening')) {
                serveReady = true;
                console.log('✅ Revideo serve process ready');

                if (!renderRequested) {
                    renderRequested = true;
                    // Make HTTP request to render endpoint
                    setTimeout(() => {
                        makeRenderRequest(outputPath, variables, serveProcess, resolve, reject);
                    }, 2000); // Wait a bit for server to be fully ready
                }
            }
        });

        serveProcess.stderr.on('data', (data) => {
            console.log('📺 Serve stderr:', data.toString());
        });

        serveProcess.on('close', (code) => {
            console.log(`📺 Serve process exited with code ${code}`);
            if (!serveReady) {
                reject(new Error(`Serve process failed to start (exit code: ${code})`));
            }
        });

        serveProcess.on('error', (error) => {
            console.error('📺 Serve process error:', error);
            reject(error);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            console.log('⏰ CLI render timeout - killing serve process');
            serveProcess.kill('SIGTERM');
            setTimeout(() => {
                if (!serveProcess.killed) {
                    serveProcess.kill('SIGKILL');
                }
            }, 5000);
            reject(new Error('CLI render timeout after 5 minutes'));
        }, 300000);
    });
}

async function makeRenderRequest(outputPath: string, variables: any, serveProcess: any, resolve: any, reject: any) {
    try {
        console.log('🌐 Making render request to local serve endpoint');

        const response = await fetch('http://localhost:3001/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables })
        });

        if (!response.ok) {
            throw new Error(`Render request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Render request successful:', result);

        // Wait a bit for file to be written
        setTimeout(() => {
            if (fs.existsSync(outputPath)) {
                console.log('📁 Output file found:', outputPath);
                serveProcess.kill('SIGTERM');
                resolve({
                    status: 'completed',
                    message: 'Video rendered successfully via CLI',
                    output_path: outputPath,
                    output_url: `/output/${path.basename(outputPath)}`,
                    file_size: fs.statSync(outputPath).size
                });
            } else {
                console.log('❌ Output file not found:', outputPath);
                serveProcess.kill('SIGTERM');
                reject(new Error('Output file was not created'));
            }
        }, 5000);

    } catch (error) {
        console.error('❌ Render request failed:', error);
        serveProcess.kill('SIGTERM');
        reject(error);
    }
}

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
    console.log("🚀 Starting render job with input:", JSON.stringify(input));

    // Try CLI approach first
    try {
        console.log("🎭 Attempting CLI-based rendering...");
        return await renderVideoCLI(input);
    } catch (cliError) {
        console.log("❌ CLI rendering failed:", cliError instanceof Error ? cliError.message : String(cliError));
        console.log("🔄 Falling back to library-based rendering...");

        // Fallback to library approach
        return await renderVideoLibFallback(input);
    }
}

async function renderVideoLibFallback(input: RenderInput): Promise<any> {
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}`;

    console.log("📚 Starting library-based render job with input:", JSON.stringify(input));

    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const projectFile = path.resolve('./dist/project.js');
        console.log(`Rendering project: ${projectFile}`);
        
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
