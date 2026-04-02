import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true as const,
  getCookie: (): Promise<string> => ipcRenderer.invoke('get-cookie'),
  setCookie: (cookie: string): Promise<void> => ipcRenderer.invoke('set-cookie', cookie),
  tradeSearch: (league: string, query: object): Promise<{ id?: string; error?: string }> =>
    ipcRenderer.invoke('trade-search', league, query),
});
