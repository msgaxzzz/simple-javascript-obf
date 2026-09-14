@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo  Emscripten SDK Setup for Luau WASM Build
echo =======================================================

set EMSDK_DIR=D:\emsdk
if not exist "%EMSDK_DIR%" (
    echo [1/3] Cloning emsdk to %EMSDK_DIR%...
    git clone --depth 1 https://github.com/emscripten-core/emsdk.git "%EMSDK_DIR%"
) else (
    echo [1/3] Found existing emsdk at %EMSDK_DIR%
)

cd /d "%EMSDK_DIR%"

echo [2/3] Installing latest Emscripten toolchain...
call emsdk.bat install latest

echo [3/3] Activating latest Emscripten toolchain...
call emsdk.bat activate latest

echo.
echo =======================================================
echo  Emscripten setup finished successfully!
echo  Run "build-luau-wasm.bat" next to build Luau WASM.
echo =======================================================
pause
