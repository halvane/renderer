# Revideo Renderer Test Script (PowerShell)
# Usage: .\test-and-serve.ps1

param(
    [int]$Port = 8000,
    [int]$MaxWaitSeconds = 60
)

# Colors
$Colors = @{
    Green  = [ConsoleColor]::Green
    Yellow = [ConsoleColor]::Yellow
    Cyan   = [ConsoleColor]::Cyan
    Red    = [ConsoleColor]::Red
    Blue   = [ConsoleColor]::Blue
}

function Write-Colored {
    param([string]$Symbol, [string]$Message, [ConsoleColor]$Color = [ConsoleColor]::White)
    Write-Host "$Symbol $Message" -ForegroundColor $Color
}

function Wait-ForServer {
    param([int]$Port, [int]$MaxAttempts)
    
    Write-Colored "⏳" "Waiting for server to start..." $Colors.Cyan
    
    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Colored "✅" "Server is ready!" $Colors.Green
                return $true
            }
        } catch {
            # Server not ready yet
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    Write-Colored "❌" "Server failed to start" $Colors.Red
    return $false
}

function Test-Render {
    param([int]$Port)
    
    Write-Colored "🎬" "Sending render request..." $Colors.Cyan
    
    $payload = @{
        input = @{
            variables = @{
                headline = "Test Render from PowerShell"
            }
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/render" `
            -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $payload `
            -UseBasicParsing

        $data = $response.Content | ConvertFrom-Json

        if ($data.status -eq "completed") {
            Write-Colored "✅" "Render succeeded!" $Colors.Green
            Write-Colored "📁" "Output: $($data.output.output_path)" $Colors.Green
            Write-Colored "📊" "File size: $($data.output.file_size) bytes" $Colors.Green
            Write-Colored "🌐" "URL: $($data.output.output_url)" $Colors.Blue
            return $true
        } else {
            Write-Colored "❌" "Render failed" $Colors.Red
            Write-Colored "💥" "$($data.output.error)" $Colors.Red
            if ($data.output.error_stack) {
                Write-Host $data.output.error_stack
            }
            return $false
        }
    } catch {
        Write-Colored "❌" "Request failed: $($_.Exception.Message)" $Colors.Red
        return $false
    }
}

# Main
Write-Colored "🚀" "Starting Revideo Renderer Server..." $Colors.Cyan
Write-Host ""

# Start server in background
$serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/handler.js" -NoNewWindow -PassThru

# Wait for server to be ready
$serverReady = Wait-ForServer -Port $Port -MaxAttempts $MaxWaitSeconds

if (-not $serverReady) {
    $serverProcess.Kill()
    exit 1
}

Write-Host ""

# Run test
$testPassed = Test-Render -Port $Port

Write-Host ""
Write-Colored "═══════════════════════════════════════════" "" $Colors.Cyan

if ($testPassed) {
    Write-Colored "ℹ️" "Server is still running on port $Port" $Colors.Green
    Write-Colored "ℹ️" "Press Ctrl+C to stop" $Colors.Yellow
    
    # Keep process alive
    $serverProcess.WaitForExit()
} else {
    Write-Colored "❌" "Test failed, stopping server" $Colors.Red
    $serverProcess.Kill()
    exit 1
}
