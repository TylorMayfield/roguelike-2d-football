import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  queryDb: (sql: string, params: any[] = []) => ipcRenderer.invoke('db-query', sql, params),
});
