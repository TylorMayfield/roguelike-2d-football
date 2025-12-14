export class InputManager {
  public keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
    });
  }

  public isKeyDown(code: string): boolean {
    return !!this.keys[code];
  }

  public getAxis(axisIndex: number): number {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
      const axis = gamepads[0].axes[axisIndex];
      // Deadzone
      if (Math.abs(axis) > 0.1) {
        return axis;
      }
    }
    return 0;
  }

  public isButtonDown(buttonIndex: number): boolean {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
      return gamepads[0].buttons[buttonIndex].pressed;
    }
    return false;
  }
}
