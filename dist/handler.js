"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function renderVideo(input) {
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}.mp4`;
    console.log("🚀 Starting render job with input:", JSON.stringify(input));
    const outputDir = path_1.default.resolve('output');
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path_1.default.join(outputDir, outputFileName);
    try {
        // Use npx to run Revideo CLI with the compiled JavaScript file
        const projectFile = path_1.default.resolve('./dist/project.js');
        const renderCommand = `npx -y @revideo/cli@0.10.4 render "${projectFile}" --output "${outputPath}"`;
        console.log("Running command:", renderCommand);
        const { stdout, stderr } = await execAsync(renderCommand);
        if (stderr) {
            console.log("Render stderr:", stderr);
        }
        console.log("Render stdout:", stdout);
        // Check if output file was created
        if (!fs_1.default.existsSync(outputPath)) {
            throw new Error(`Output file was not created: ${outputPath}`);
        }
        console.log("✅ Render complete!");
        return {
            status: 'completed',
            message: 'Video rendered successfully',
            output_path: outputPath,
            output_url: `/output/${outputFileName}`,
            file_size: fs_1.default.statSync(outputPath).size
        };
    }
    catch (err) {
        console.error("❌ Render error:", err);
        return {
            status: 'failed',
            error: err.message || String(err)
        };
    }
}
// Create HTTP server to handle RunPod requests
const server = http_1.default.createServer(async (req, res) => {
    // Serve static files from output directory
    if (req.method === 'GET' && req.url?.startsWith('/output/')) {
        const fileName = req.url.replace('/output/', '');
        // Validate filename to prevent directory traversal
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        const filePath = path_1.default.join(path_1.default.resolve('output'), fileName);
        if (fs_1.default.existsSync(filePath)) {
            const stat = fs_1.default.statSync(filePath);
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': stat.size
            });
            const readStream = fs_1.default.createReadStream(filePath);
            readStream.pipe(res);
            return;
        }
        else {
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
                const runpodRequest = JSON.parse(body);
                console.log('Received RunPod request:', runpodRequest.id);
                const result = await renderVideo(runpodRequest.input);
                const response = {
                    output: result,
                    status: result.status
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            }
            catch (error) {
                console.error('Request processing error:', error);
                const errorResponse = {
                    error: error.message,
                    status: 'failed'
                };
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(errorResponse));
            }
        });
    }
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});
const PORT = process.env.PORT || 8000;
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Revideo renderer listening on port ${PORT}`);
});
//# sourceMappingURL=handler.js.map