import { SettingsManager } from './SettingsManager';
import { InputManager } from './InputManager';
import { HUDManager } from '../rendering/HUDManager';

export enum GameState {
  MENU,
  PLAYING,
  SETTINGS,
}

export class GameManager {
  public currentState: GameState;
  private onStartGame: () => void;
  private settingsManager: SettingsManager;
  private inputManager: InputManager;
  private lastButtonState: { [key: number]: boolean } = {};

  constructor(onStartGame: () => void, inputManager: InputManager) {
    this.currentState = GameState.MENU;
    this.onStartGame = onStartGame;
    this.inputManager = inputManager;
    this.settingsManager = new SettingsManager();
    this.initialize();
  }

  public update() {
    // Basic Controller Menu Support
    if (this.currentState === GameState.MENU) {
      if (this.inputManager.isButtonDown(0) || this.inputManager.isButtonDown(9)) {
        if (!this.lastButtonState[0] && !this.lastButtonState[9]) {
          this.startGame();
        }
      }
      if (this.inputManager.isButtonDown(3)) { 
         if (!this.lastButtonState[3]) {
           this.openSettings();
         }
      }
    } else if (this.currentState === GameState.SETTINGS) {
       if (this.inputManager.isButtonDown(1)) { // B to back
         if (!this.lastButtonState[1]) {
           this.closeSettings();
         }
       }
    }

    // Update last state to prevent spam
    this.lastButtonState[0] = this.inputManager.isButtonDown(0);
    this.lastButtonState[1] = this.inputManager.isButtonDown(1);
    this.lastButtonState[3] = this.inputManager.isButtonDown(3);
    this.lastButtonState[9] = this.inputManager.isButtonDown(9);
  }

  private initialize() {
    this.settingsManager.loadSettings();

    // Listen for UI Events
    window.addEventListener('game:start', () => this.startGame());
    window.addEventListener('ui:settings:open', () => this.openSettings());
    window.addEventListener('ui:settings:close', () => this.closeSettings());
    window.addEventListener('settings:save', (e: any) => {
        this.saveSettings(e.detail);
    });
  }

  public startGame() {
    this.currentState = GameState.PLAYING;
    HUDManager.setScreen('hud');
    this.onStartGame();
  }

  public openSettings() {
    this.currentState = GameState.SETTINGS;
    HUDManager.setScreen('settings');
  }

  public closeSettings() {
    this.currentState = GameState.MENU;
    HUDManager.setScreen('menu');
  }

  private saveSettings(settings: { resolution: string, antialias: boolean, volume: number }) {
    const [width, height] = settings.resolution.split('x').map(Number);
    this.settingsManager.saveSetting('resolutionWidth', width);
    this.settingsManager.saveSetting('resolutionHeight', height);
    this.settingsManager.saveSetting('antialias', settings.antialias);
    this.settingsManager.saveSetting('volume', settings.volume);
  }
}
