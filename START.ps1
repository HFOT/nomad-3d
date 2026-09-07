$ErrorActionPreference = 'Stop'
$viewerRoot = $PSScriptRoot
$viewerUrl = 'http://127.0.0.1:8846'
$viewerReady = $false
try { $viewerResponse = Invoke-WebRequest -Uri $viewerUrl -UseBasicParsing -TimeoutSec 2; $viewerReady = $viewerResponse.Content.Contains('CARAKURI') } catch {}
if (-not $viewerReady) {
    $viewerNode = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (-not $viewerNode) { $viewerNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
    if (-not (Test-Path -LiteralPath $viewerNode)) { throw 'Node.js could not be found.' }
    Start-Process -FilePath $viewerNode -ArgumentList ('"' + (Join-Path $viewerRoot 'server.cjs') + '"') -WorkingDirectory $viewerRoot -WindowStyle Hidden
    for ($viewerAttempt=0; $viewerAttempt -lt 30; $viewerAttempt++) {
        Start-Sleep -Milliseconds 200
        try { $viewerResponse = Invoke-WebRequest -Uri $viewerUrl -UseBasicParsing -TimeoutSec 1; if ($viewerResponse.Content.Contains('CARAKURI')) { $viewerReady=$true; break } } catch {}
    }
}
if (-not $viewerReady) { throw 'The viewer could not start. Port 8846 may be occupied.' }
Start-Process $viewerUrl
