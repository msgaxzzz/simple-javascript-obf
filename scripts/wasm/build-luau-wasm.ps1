# Compile Luau to WebAssembly via Emscripten
$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Building Official Luau to WebAssembly (WASM)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$EmsdkDir = "D:\emsdk"
$ProjectRoot = "D:\obf\bun\simple-javascript-obf"
$LuauDir = "$ProjectRoot\third_party\luau"
$BuildDir = "$LuauDir\build-wasm"
$DistDir = "$ProjectRoot\src\luau\wasm\dist"

if (-not (Test-Path "$EmsdkDir\emsdk_env.bat")) {
    Write-Error "Emscripten not found at $EmsdkDir! Please run setup-emsdk.bat first."
}

Write-Host "[1/4] Checking Luau submodule..." -ForegroundColor Yellow
if (-not (Test-Path "$LuauDir\CMakeLists.txt")) {
    Set-Location $ProjectRoot
    git submodule update --init --recursive third_party/luau
}

Write-Host "[2/4] Setting up build directory..." -ForegroundColor Yellow
if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
}

Set-Location $LuauDir

Write-Host "[3/4] Configuring CMake and Compiling with Emscripten..." -ForegroundColor Yellow
cmd.exe /c "call `"$EmsdkDir\emsdk_env.bat`" && emcmake cmake -B `"$BuildDir`" -S . -DLUAU_BUILD_WEB=ON -DCMAKE_BUILD_TYPE=Release && cmake --build `"$BuildDir`" --target Luau.Web -j"

Write-Host "[4/4] Copying build artifacts to $DistDir..." -ForegroundColor Yellow
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Force -Path $DistDir | Out-Null
}

if (Test-Path "$BuildDir\Luau.Web.js") {
    Copy-Item "$BuildDir\Luau.Web.js" "$DistDir\luau.web.js" -Force
    Write-Host "Copied: luau.web.js" -ForegroundColor Green
}
if (Test-Path "$BuildDir\Luau.Web.wasm") {
    Copy-Item "$BuildDir\Luau.Web.wasm" "$DistDir\luau.web.wasm" -Force
    Write-Host "Copied: luau.web.wasm" -ForegroundColor Green
}

Write-Host "`nBuild complete! WASM module deployed to $DistDir." -ForegroundColor Green
