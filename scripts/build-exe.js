const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const iconPath = path.join(root, "assets", "blank.ico");
const entry = path.join(root, "bin", "js-obf.js");
const bundlePath = path.join(distDir, "obveil.bundle.cjs");
const seaConfigPath = path.join(distDir, "sea-config.json");
const seaBlobPath = path.join(distDir, "obveil-sea.blob");
const javaDir = path.join(root, "src", "java");

function getArg(name) {
  const prefix = `${name}=`;
  for (let i = 0; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === name) {
      return process.argv[i + 1];
    }
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
  }
  return undefined;
}

const platform = getArg("--platform") || process.platform;
const requestedArch = getArg("--arch");
const arch =
  requestedArch ||
  (platform === "linux" && process.platform === "win32" ? "x64" : process.arch);

function writeBlankIcon(file) {
  const width = 32;
  const height = 32;
  const xorSize = width * height * 4;
  const andSize = height * 4;
  const imageSize = 40 + xorSize + andSize;
  const icon = Buffer.alloc(22 + imageSize);

  icon.writeUInt16LE(0, 0);
  icon.writeUInt16LE(1, 2);
  icon.writeUInt16LE(1, 4);
  icon[6] = width;
  icon[7] = height;
  icon[8] = 0;
  icon[9] = 0;
  icon.writeUInt16LE(1, 10);
  icon.writeUInt16LE(32, 12);
  icon.writeUInt32LE(imageSize, 14);
  icon.writeUInt32LE(22, 18);

  icon.writeUInt32LE(40, 22);
  icon.writeInt32LE(width, 26);
  icon.writeInt32LE(height * 2, 30);
  icon.writeUInt16LE(1, 34);
  icon.writeUInt16LE(32, 36);
  icon.writeUInt32LE(0, 38);
  icon.writeUInt32LE(xorSize, 42);
  icon.fill(0xff, 22 + 40 + xorSize);

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, icon);
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function loadDevDependency(name) {
  try {
    return require(name);
  } catch {
    throw new Error(
      `Missing dev dependency "${name}". Run npm install --include=dev first.`
    );
  }
}

async function download(url, destination) {
  if (fs.existsSync(destination)) {
    return;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, data);
}

async function ensureLinuxNode(version, targetArch) {
  const cacheDir = path.join(distDir, "cache");
  const release = `node-v${version}-linux-${targetArch}`;
  const extractedDir = path.join(cacheDir, release);
  const nodePath = path.join(extractedDir, "bin", "node");
  if (fs.existsSync(nodePath)) {
    return nodePath;
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  const archive = path.join(cacheDir, `${release}.tar.xz`);
  await download(
    `https://nodejs.org/dist/v${version}/${release}.tar.xz`,
    archive
  );
  spawnSync("tar", ["-xf", archive, "-C", cacheDir], {
    cwd: root,
    stdio: "inherit",
  });
  // Windows tar can fail on Linux symlinks like bin/npm while still extracting
  // bin/node successfully. The archive is only used as a SEA base binary.
  if (!fs.existsSync(nodePath)) {
    throw new Error(`Failed to extract ${archive}`);
  }
  return nodePath;
}

function applyWindowsIcon(exePath) {
  const ResEdit = loadDevDependency("resedit");
  const exeData = fs.readFileSync(exePath);
  const executable = ResEdit.NtExecutable.from(exeData, { ignoreCert: true });
  const resources = ResEdit.NtExecutableResource.from(executable);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries);
  const group = groups[0];
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    resources.entries,
    group ? group.id : 1,
    group ? group.lang : 1033,
    iconFile.icons.map((item) => item.data)
  );
  resources.outputResource(executable);
  fs.writeFileSync(exePath, Buffer.from(executable.generate()));
}

async function main() {
  const ncc = loadDevDependency("@vercel/ncc");
  const postject = loadDevDependency("postject");

  fs.mkdirSync(distDir, { recursive: true });
  writeBlankIcon(iconPath);

  const { code } = await ncc(entry, {
    minify: true,
    sourceMap: false,
    cache: false,
  });
  fs.writeFileSync(bundlePath, code);

  const assets = {};
  for (const file of walk(javaDir)) {
    const relative = path.relative(javaDir, file).split(path.sep).join("/");
    assets[`java/${relative}`] = file;
  }

  const seaConfig = {
    main: bundlePath,
    output: seaBlobPath,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    assets,
  };
  fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

  const sea = spawnSync(
    process.execPath,
    ["--experimental-sea-config", seaConfigPath],
    { cwd: root, stdio: "inherit" }
  );
  if (sea.status !== 0) {
    throw new Error("Node SEA blob generation failed.");
  }

  let baseNode;
  let output;
  if (platform === "win32") {
    if (process.platform !== "win32") {
      throw new Error("Windows executables can only be built on Windows.");
    }
    baseNode = process.execPath;
    output = path.join(distDir, "obveil.exe");
  } else if (platform === "linux") {
    if (
      process.platform === "linux" &&
      (!requestedArch || requestedArch === process.arch)
    ) {
      baseNode = process.execPath;
      output = path.join(
        distDir,
        requestedArch ? `obveil-linux-${requestedArch}` : "obveil"
      );
    } else {
      baseNode = await ensureLinuxNode(
        process.version.replace(/^v/, ""),
        arch
      );
      output = path.join(distDir, `obveil-linux-${arch}`);
    }
  } else if (platform === "darwin") {
    if (process.platform !== "darwin") {
      throw new Error("macOS executables can only be built on macOS.");
    }
    baseNode = process.execPath;
    output = path.join(distDir, `obveil-macos-${process.arch}`);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  fs.copyFileSync(baseNode, output);
  const injectOptions = {
    sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    overwrite: true,
  };
  if (platform === "darwin") {
    injectOptions.machoSegmentName = "NODE_SEA";
  }
  await postject.inject(
    output,
    "NODE_SEA_BLOB",
    fs.readFileSync(seaBlobPath),
    injectOptions
  );

  if (platform === "win32") {
    applyWindowsIcon(output);
  } else {
    fs.chmodSync(output, 0o755);
  }

  console.log(`Built ${output}`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
