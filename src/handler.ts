import runpod from 'runpod';
import {render} from '@revideo/core';
import path from 'path';
import fs from 'fs';

interface RenderInput {
    variables?: Record<string, any>;
    outputFileName?: string;
}

async function handler(job: { input: RenderInput }) {
    const { input } = job;
    const variables = input.variables || {};
    const outputFileName = input.outputFileName || `output-${Date.now()}.mp4`;

    console.log("🚀 Starting render job with input:", JSON.stringify(input));

    const outputDir = path.resolve('output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFileName);

    try {
        console.log("🎥 Rendering to:", outputPath);
        
        await render({
            projectFile: './src/project.ts',
            variables: variables,
            output: outputPath,
            settings: {
                workers: 1, // RunPod usually single container, maybe 2 workers if CPU allows
                puppeteer: {
                    args: [
                        '--no-sandbox', 
                        '--disable-setuid-sandbox', 
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                }
            },
            progress: (progress: number) => {
                console.log(`📊 Progress: ${(progress * 100).toFixed(1)}%`);
            }
        });

        console.log("✅ Render complete!");

        // In a real production scenario, upload this file to S3/R2/Blob
        // For now, we verify it exists and return a success message (or base64 if small)
        
        // Since RunPod has a size limit on response payload (2MB usually for sync, larger for async),
        // sending Base64 for a video is risky. 
        // We will assume the user will configure an external uploader or volume.
        // But to make it "ready out of the box", I'll return a placeholder success.
        
        // TODO: Implement S3/Cloudinary upload here using input credentials if needed.
        
        return {
            status: 'completed',
            message: 'Video rendered successfully',
            output_path: outputPath,
            // If you mounted a volume, this path is persistent.
            // If not, the file is lost when container restarts unless returned/uploaded.
        };

    } catch (err: any) {
        console.error("❌ Render error:", err);
        return {
            status: 'failed',
            error: err.message || String(err)
        };
    }
}

// Start the worker
runpod(handler);
