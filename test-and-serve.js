#!/usr/bin/env node
/**
 * Test script for Revideo Renderer
 * Starts the server and runs render tests
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8000;
const API_URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(symbol, message, color = 'reset') {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 30) {
  log('⏳', 'Waiting for server to start...', 'cyan');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        log('✅', 'Server is ready!', 'green');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await sleep(1000);
    process.stdout.write('.');
  }
  
  console.log('');
  log('❌', 'Server failed to start', 'red');
  return false;
}

async function testRender() {
  log('🎬', 'Sending render request...', 'cyan');
  
  const payload = {
    input: {
      variables: {
        headline: 'Test Render from Script'
      }
    }
  };

  try {
    const response = await fetch(`${API_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === 'completed') {
      log('✅', 'Render succeeded!', 'green');
      log('📁', `Output: ${data.output.output_path}`, 'green');
      log('📊', `File size: ${data.output.file_size} bytes`, 'green');
      log('🌐', `URL: ${data.output.output_url}`, 'blue');
      return true;
    } else {
      log('❌', 'Render failed', 'red');
      log('💥', data.output.error, 'red');
      if (data.output.error_stack) {
        console.log(data.output.error_stack);
      }
      return false;
    }
  } catch (error) {
    log('❌', `Request failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀', 'Starting Revideo Renderer Server...', 'cyan');
  console.log('');

  // Start the server
  const server = spawn('node', ['dist/handler.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Pipe server output
  server.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  server.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  server.on('error', (error) => {
    log('❌', `Failed to start server: ${error.message}`, 'red');
    process.exit(1);
  });

  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    server.kill();
    process.exit(1);
  }

  console.log('');

  // Run test
  const testPassed = await testRender();

  console.log('');
  log('═══════════════════════════════════════════', '', 'cyan');
  
  // Keep server running or exit based on test result
  if (testPassed) {
    log('ℹ️', 'Server is still running on port 8000', 'green');
    log('ℹ️', 'Press Ctrl+C to stop', 'yellow');
    // Keep process alive
    await new Promise(() => {});
  } else {
    log('❌', 'Test failed, stopping server', 'red');
    server.kill();
    process.exit(1);
  }
}

main().catch(error => {
  log('❌', error.message, 'red');
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('');
  log('⏹️', 'Stopping server...', 'yellow');
  process.exit(0);
});
