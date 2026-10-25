$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:UV_CACHE_DIR = Join-Path $PSScriptRoot '.cache\uv'
$env:HF_HOME = Join-Path $PSScriptRoot '.cache\huggingface'
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = '1'
$env:HF_HUB_DISABLE_XET = '1'
Remove-Item Env:HF_HUB_OFFLINE -ErrorAction SilentlyContinue
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw 'Install uv from https://docs.astral.sh/uv/getting-started/installation/ and rerun setup.ps1.'
}
if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
    uv venv --python 3.12 .venv
    if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
}
uv pip install --python .venv\Scripts\python.exe -r requirements.txt --torch-backend cpu
if ($LASTEXITCODE -ne 0) { throw 'Laya dependency installation failed.' }
& .\.venv\Scripts\python.exe -c "from inference import LayaDecision; model=LayaDecision(); model.load(); print(model.metadata()); raise SystemExit(0 if model.status=='ready' else 1)"
if ($LASTEXITCODE -ne 0) { throw 'Laya checkpoint loading failed. Rerun setup.ps1 to retry the cached download.' }
Write-Output 'Ready. Run .\start.ps1 and open http://127.0.0.1:8788.'
