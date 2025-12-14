
export interface UIState {
    screen: 'menu' | 'hud' | 'settings';
    scoreHome: number;
    scoreAway: number;
    down: number;
    distanceToFirst: number;
    playStateMessage: string;
    showPlayPicker: boolean;
    playPickerVisible: boolean;
    // Kick Meter
    showKickMeter: boolean;
    kickPower: number;
    kickPhase: 'power' | 'accuracy' | 'done';
    kickAccuracyPosition: number;
}

type Listener = (state: UIState) => void;

class UIStoreClass {
    private state: UIState = {
        screen: 'menu',
        scoreHome: 0,
        scoreAway: 0,
        down: 1,
        distanceToFirst: 10,
        playStateMessage: '',
        showPlayPicker: false,
        playPickerVisible: false,
        // Kick Meter
        showKickMeter: false,
        kickPower: 0,
        kickPhase: 'power',
        kickAccuracyPosition: 0.5
    };

    private listeners: Listener[] = [];

    public subscribe(listener: Listener) {
        this.listeners.push(listener);
        listener(this.state); // Immediate update
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public update(partialState: Partial<UIState>) {
        this.state = { ...this.state, ...partialState };
        this.notify();
    }
    
    public getState() {
        return this.state;
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }
}

export const UIStore = new UIStoreClass();
