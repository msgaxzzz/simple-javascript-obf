const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const iconPath = path.join(root, "assets", "blank.ico");
const entry = path.join(root, "bin", "js-obf.js");
const output = path.join(root, "dist", "obveil.exe");

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

writeBlankIcon(iconPath);

fs.mkdirSync(path.dirname(output), { recursive: true });
const args = [
  "build",
  "--compile",
  `--windows-icon=${iconPath}`,
  "--windows-title=Obveil",
  `--outfile=${output}`,
  entry,
];
const result = spawnSync("bun", args, {
  cwd: root,
  stdio: "inherit",
});
process.exit(result.status === null ? 1 : result.status);
