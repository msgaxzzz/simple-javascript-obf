# Luau WebAssembly (WASM) 构建说明

本项目支持通过 Emscripten 将 `third_party/luau` 官方 C++ 源码编译为 WebAssembly，并在 Bun / Node.js 架构下实现**双引擎（Dual Version）**无缝切换。

---

## 一键执行脚本位置

所有构建与安装脚本已放置在当前工程的 `scripts/wasm/` 目录下：

| 脚本路径 | 说明 | 执行命令 |
| :--- | :--- | :--- |
| [`scripts/wasm/setup-emsdk.bat`](file:///D:/obf/bun/simple-javascript-obf/scripts/wasm/setup-emsdk.bat) | 安装并激活 Emscripten SDK（至 `D:\emsdk`） | 双击运行 或 `.\scripts\wasm\setup-emsdk.bat` |
| [`scripts/wasm/build-luau-wasm.bat`](file:///D:/obf/bun/simple-javascript-obf/scripts/wasm/build-luau-wasm.bat) | 自动加载环境、编译官方 Luau 并产出 WASM 模块 | 双击运行 或 `.\scripts\wasm\build-luau-wasm.bat` |
| [`scripts/wasm/setup-emsdk.ps1`](file:///D:/obf/bun/simple-javascript-obf/scripts/wasm/setup-emsdk.ps1) | PowerShell 版环境配置脚本 | `pwsh .\scripts\wasm\setup-emsdk.ps1` |
| [`scripts/wasm/build-luau-wasm.ps1`](file:///D:/obf/bun/simple-javascript-obf/scripts/wasm/build-luau-wasm.ps1) | PowerShell 版编译打包脚本 | `pwsh .\scripts\wasm\build-luau-wasm.ps1` |

---

## 步骤说明

### 步骤 1：安装 Emscripten
在终端执行：
```cmd
cd D:\obf\bun\simple-javascript-obf\scripts\wasm
setup-emsdk.bat
```
或者直接在 `D:\emsdk` 目录下执行：
```cmd
cd D:\emsdk
emsdk.bat install latest
emsdk.bat activate latest
```

### 步骤 2：构建 Luau WASM
在终端执行：
```cmd
cd D:\obf\bun\simple-javascript-obf\scripts\wasm
build-luau-wasm.bat
```

构建完成后，产物会自动部署到：
- `src/luau/wasm/dist/luau.web.js`
- `src/luau/wasm/dist/luau.web.wasm`

---

## 导出的四大核心功能
构建出的 WASM 模块已通过 Emscripten 导出以下 C 函数：
1. `_astScript(source)`：利用官方 `Luau::toJson` 输出精准 JSON 语法树；
2. `_compileScript(source)`：官方字节码编译器输出；
3. `_checkScript(source)`：官方前端类型检查与语法校验；
4. `_executeScript(source)`：沙箱化 WASM VM 原生执行。
