import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import http from 'http';

const execAsync = promisify(exec);

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
    const outputFileName = input.outputFileName || `output-${Date.now()}.mp4`;

    console.log("🚀 Starting render job with input:", JSON.stringify(input));

    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFileName);

    try {
        // Use Revideo CLI to render (try global first, fallback to npx)
        const projectFile = path.resolve('./src/project.ts');
        const renderCommand = `revideo render "${projectFile}" --output "${outputPath}" 2>/dev/null || npx -p @revideo/cli revideo render "${projectFile}" --output "${outputPath}"`;

        console.log("Running command:", renderCommand);
        const { stdout, stderr } = await execAsync(renderCommand);

        if (stderr) {
            console.log("Render stderr:", stderr);
        }

        console.log("Render stdout:", stdout);

        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
            throw new Error(`Output file was not created: ${outputPath}`);
        }

        console.log("✅ Render complete!");

        return {
            status: 'completed',
            message: 'Video rendered successfully',
            output_path: outputPath,
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
server.listen(PORT, () => {
    console.log(`🚀 Revideo renderer listening on port ${PORT}`);
});
