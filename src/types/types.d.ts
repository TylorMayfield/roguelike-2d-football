export interface ElectronAPI {
  queryDb: (sql: string, params?: any[]) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
