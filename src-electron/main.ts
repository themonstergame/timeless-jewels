import { app, BrowserWindow, ipcMain, net, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { proxyTrade } from './proxy';

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

function loadSettings(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveSettings(settings: Record<string, string>): void {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the default browser instead of Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_DEV === '1') {
    win.loadURL(process.env.VITE_URL ?? 'http://localhost:5173/tree');
  } else {
    win.loadFile(path.join(__dirname, '../frontend/build/tree/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-cookie', () => {
    return loadSettings().tencent_cookie ?? '';
  });

  ipcMain.handle('set-cookie', (_, cookie: string) => {
    const settings = loadSettings();
    settings.tencent_cookie = cookie;
    saveSettings(settings);
  });

  ipcMain.handle('trade-search', async (_, league: string, query: object) => {
    const cookie = loadSettings().tencent_cookie ?? '';
    return await proxyTrade(league, query, cookie);
  });

ipcMain.handle('get-leagues', async () => {
    const cookie = loadSettings().tencent_cookie ?? '';
    try {
      const response = await net.fetch(
        'https://poe.game.qq.com/api/leagues?type=main&realm=pc',
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Origin: 'https://poe.game.qq.com',
            ...(cookie ? { Cookie: cookie } : {}),
          },
        }
      );
      const json = (await response.json()) as Array<{ id: string; name?: string }>;
      return json.map((l) => ({ id: l.id, label: l.name ?? l.id }));
    } catch (err) {
      return { error: String(err) };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
