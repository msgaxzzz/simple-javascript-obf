@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo  Building Official Luau to WebAssembly (WASM) via Emscripten
echo =======================================================

set EMSDK_DIR=D:\emsdk
if not exist "%EMSDK_DIR%\emsdk_env.bat" (
    echo [ERROR] Emscripten not found at %EMSDK_DIR%!
    echo Please run "setup-emsdk.bat" first.
    exit /b 1
)

echo [1/5] Activating Emscripten environment...
call "%EMSDK_DIR%\emsdk_env.bat"

set PROJECT_ROOT=D:\obf\bun\simple-javascript-obf
set LUAU_DIR=%PROJECT_ROOT%\third_party\luau
set BUILD_DIR=%LUAU_DIR%\build-wasm
set DIST_DIR=%PROJECT_ROOT%\src\luau\wasm\dist

echo [2/5] Checking Luau submodule at %LUAU_DIR%...
if not exist "%LUAU_DIR%\CMakeLists.txt" (
    echo Submodule empty, initializing...
    cd /d "%PROJECT_ROOT%"
    git submodule update --init --recursive third_party/luau
)

echo [3/5] Configuring CMake with Emscripten (emcmake)...
cd /d "%LUAU_DIR%"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

call emcmake cmake -B "%BUILD_DIR%" -S . ^
    -DLUAU_BUILD_WEB=ON ^
    -DCMAKE_BUILD_TYPE=Release

if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed!
    exit /b %errorlevel%
)

echo [4/5] Compiling Luau.Web WebAssembly target...
call cmake --build "%BUILD_DIR%" --target Luau.Web -j

if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    exit /b %errorlevel%
)

echo [5/5] Copying WASM build artifacts to %DIST_DIR%...
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

if exist "%BUILD_DIR%\Luau.Web.js" copy /y "%BUILD_DIR%\Luau.Web.js" "%DIST_DIR%\luau.web.js"
if exist "%BUILD_DIR%\Luau.Web.wasm" copy /y "%BUILD_DIR%\Luau.Web.wasm" "%DIST_DIR%\luau.web.wasm"

echo.
echo =======================================================
echo  Luau WASM successfully built and deployed!
echo  Artifacts deployed to: %DIST_DIR%
echo =======================================================
pause
