param([int]$Port = 8788)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$gamePython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $gamePython)) {
    throw 'Run .\setup.ps1 first to install the local Laya runtime.'
}
$env:HF_HOME = Join-Path $PSScriptRoot '.cache\huggingface'
$env:HF_HUB_OFFLINE = '1'
& $gamePython -u app.py --port $Port
