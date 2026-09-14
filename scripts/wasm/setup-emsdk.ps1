# Emscripten SDK Setup PowerShell Script
$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Emscripten SDK Setup for Luau WASM Build" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$EmsdkDir = "D:\emsdk"
if (-not (Test-Path $EmsdkDir)) {
    Write-Host "[1/3] Cloning emsdk to $EmsdkDir..." -ForegroundColor Yellow
    git clone --depth 1 https://github.com/emscripten-core/emsdk.git $EmsdkDir
} else {
    Write-Host "[1/3] Found existing emsdk at $EmsdkDir" -ForegroundColor Green
}

Set-Location $EmsdkDir

Write-Host "[2/3] Installing latest Emscripten toolchain..." -ForegroundColor Yellow
& .\emsdk.bat install latest

Write-Host "[3/3] Activating latest Emscripten toolchain..." -ForegroundColor Yellow
& .\emsdk.bat activate latest

Write-Host "`nEmscripten setup finished successfully!" -ForegroundColor Green
Write-Host "Run .\scripts\wasm\build-luau-wasm.bat or build-luau-wasm.ps1 next to compile Luau WASM." -ForegroundColor Cyan
