"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const renderer_1 = require("@revideo/renderer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
async function renderVideo(input) {
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}`;
    console.log("🚀 Starting render job");
    console.log("📝 Input variables:", JSON.stringify(variables));
    const outputDir = path_1.default.resolve('output');
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    try {
        const projectFile = path_1.default.resolve('./src/project.ts');
        console.log(`📁 Project file: ${projectFile}`);
        console.log(`📹 Starting renderVideoLib...`);
        // Simple renderVideoLib call like the example
        const outputPath = await (0, renderer_1.renderVideo)({
            projectFile: projectFile,
            variables: variables,
            settings: {
                logProgress: true
            }
        });
        console.log(`✅ Render complete`);
        console.log(`📁 Output path: ${outputPath}`);
        if (!fs_1.default.existsSync(outputPath)) {
            throw new Error(`Output file not created: ${outputPath}`);
        }
        const fileSize = fs_1.default.statSync(outputPath).size;
        console.log(`📊 Output file size: ${fileSize} bytes`);
        return {
            status: 'completed',
            message: 'Video rendered successfully',
            output_path: outputPath,
            output_url: `/output/${path_1.default.basename(outputPath)}`,
            file_size: fileSize
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error(`❌ Render failed: ${errorMessage}`);
        if (errorStack) {
            console.error(`📋 Stack:`, errorStack);
        }
        return {
            status: 'failed',
            error: errorMessage,
            error_stack: errorStack
        };
    }
}
async function handleRequest(req) {
    console.log('📨 Received request:', req.id);
    if (!req.input) {
        return {
            status: 'failed',
            error: 'Missing input field'
        };
    }
    const result = await renderVideo(req.input);
    return {
        output: result,
        status: result.status
    };
}
// HTTP Server
const PORT = parseInt(process.env.PORT || '8000', 10);
const server = http_1.default.createServer(async (req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }
    if (req.method === 'POST' && req.url === '/render') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const input = JSON.parse(body);
                console.log('✅ Parsed request body');
                const response = await handleRequest({
                    input: input.input || input,
                    id: Math.random().toString(36).substr(2, 9)
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('❌ Request handling error:', errorMessage);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'failed',
                    error: errorMessage
                }));
            }
        });
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});
server.listen(PORT, () => {
    console.log(`\n✅ Revideo Renderer Server listening on port ${PORT}`);
    console.log(`   POST http://localhost:${PORT}/render - Render video`);
    console.log(`   GET  http://localhost:${PORT}/health - Health check\n`);
});
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=handler.js.map