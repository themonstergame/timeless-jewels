import { spawn, execSync } from 'child_process';

// Compile Electron TypeScript first
execSync('bun run build:electron', { stdio: 'inherit' });

// Start Vite dev server
const vite = spawn('bun', ['run', 'dev'], {
  cwd: 'frontend',
  stdio: ['inherit', 'pipe', 'pipe'],
});

let electronProcess: ReturnType<typeof spawn> | null = null;
let electronStarted = false;

function startElectron(viteUrl: string) {
  if (electronStarted) return;
  electronStarted = true;
  console.log(`[dev] Vite ready at ${viteUrl}, launching Electron...`);

  electronProcess = spawn('electron', ['.'], {
    env: { ...process.env, ELECTRON_DEV: '1', VITE_URL: `${viteUrl}/tree` },
    stdio: 'inherit',
  });

  electronProcess.on('close', () => {
    vite.kill();
    process.exit(0);
  });
}

// Parse the actual port from Vite's startup output
function parseViteUrl(text: string) {
  const match = text.match(/Local:\s+(http:\/\/localhost:\d+)/);
  if (match) startElectron(match[1]);
}

vite.stdout?.on('data', (chunk: Buffer) => {
  const text = chunk.toString();
  process.stdout.write(`[vite] ${text}`);
  parseViteUrl(text);
});

vite.stderr?.on('data', (chunk: Buffer) => {
  process.stderr.write(`[vite] ${chunk}`);
});

vite.on('close', (code) => {
  if (!electronStarted) process.exit(code ?? 1);
});

process.on('SIGINT', () => {
  vite.kill();
  electronProcess?.kill();
  process.exit(0);
});
