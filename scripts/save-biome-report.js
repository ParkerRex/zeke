#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { mkdirSync, createWriteStream } = require('node:fs');
const { join } = require('node:path');

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getUTCFullYear();
  const mm = pad(now.getUTCMonth() + 1);
  const dd = pad(now.getUTCDate());
  const hh = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

const outDir = join(process.cwd(), 'docs', 'lints');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${timestamp()}.json`);
const outStream = createWriteStream(outPath);

const biomeBin = join(process.cwd(), 'node_modules', '.bin', 'biome');
const proc = spawn(biomeBin, ['lint', '--reporter=json', '.'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});

proc.stdout.pipe(outStream);

proc.on('close', (code) => {
  if (code !== 0) {
    console.error(`biome exited with code ${code}`);
    process.exitCode = code;
  }
  // Print the path so callers can find the file
  console.log(`\nSaved Biome report to: ${outPath}`);
});

