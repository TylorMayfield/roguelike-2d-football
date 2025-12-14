export interface GameSettings {
  resolutionWidth: number;
  resolutionHeight: number;
  antialias: boolean;
  volume: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  resolutionWidth: 1280,
  resolutionHeight: 720,
  antialias: false,
  volume: 1.0,
};

export class SettingsManager {
  public settings: GameSettings;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  public async loadSettings() {
    try {
      const rows: any[] = await window.electronAPI.queryDb('SELECT key, value FROM settings');
      rows.forEach((row) => {
        if (row.key in this.settings) {
          // Parse value based on type in default settings
          const defaultValue = (DEFAULT_SETTINGS as any)[row.key];
          if (typeof defaultValue === 'number') {
            (this.settings as any)[row.key] = parseFloat(row.value);
          } else if (typeof defaultValue === 'boolean') {
            (this.settings as any)[row.key] = row.value === 'true';
          } else {
            (this.settings as any)[row.key] = row.value;
          }
        }
      });
      console.log('Settings loaded:', this.settings);
      this.applySettings();
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  public async saveSetting(key: keyof GameSettings, value: any) {
    (this.settings as any)[key] = value;
    try {
      await window.electronAPI.queryDb(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, String(value)]
      );
      this.applySettings();
    } catch (e) {
      console.error('Failed to save setting:', e);
    }
  }

  private applySettings() {
    // Apply Volume (if we had audio)
    // AudioListener.setMasterVolume(this.settings.volume);
    
    // Resolution and AA changes might require a restart or window resize IPC
    // For now, we'll just log it. In a real app, we'd send an IPC to main to resize.
    console.log('Applying settings:', this.settings);
  }
}
