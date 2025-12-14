import { FootballRules, PlayState } from '../game/FootballRules';
import { UIStore } from '../ui/UIStore';

/**
 * HUDManager - Handles all UI/HUD updates via React UIStore.
 * Now acts as a bridge between Game Logic and React UI.
 */
class HUDManagerClass {
    public init() {
        // No-op for now, store is singleton
    }

    public update(footballRules: FootballRules) {
        let message = '';
        
        if (footballRules.playState === PlayState.COIN_FLIP) {
            message = "COIN TOSS: Press 'H' for Heads, 'T' for Tails";
        } else if (footballRules.playState === PlayState.KICKOFF) {
            if (footballRules.kickingTeam === 'home') {
                message = "KICKOFF: Press 'K' or SPACE to Kick";
            } else {
                message = "Receiving Kickoff...";
            }
        }

        UIStore.update({
             scoreHome: footballRules.scoreHome,
             scoreAway: footballRules.scoreAway,
             down: footballRules.down,
             distanceToFirst: footballRules.distanceToFirst,
             playStateMessage: message
        });
    }

    public showPlayPicker() {
        UIStore.update({ showPlayPicker: true });
    }

    public hidePlayPicker() {
        UIStore.update({ showPlayPicker: false });
    }
    
    public setScreen(screen: 'menu' | 'hud' | 'settings') {
        UIStore.update({ screen });
    }

    // Kick Meter
    public showKickMeter() {
        UIStore.update({ 
            showKickMeter: true, 
            kickPower: 0, 
            kickPhase: 'power',
            kickAccuracyPosition: 0.5
        });
    }

    public hideKickMeter() {
        UIStore.update({ showKickMeter: false });
    }

    public updateKickMeter(power: number, phase: 'power' | 'accuracy' | 'done', accuracyPosition: number) {
        UIStore.update({ kickPower: power, kickPhase: phase, kickAccuracyPosition: accuracyPosition });
    }
}

// Singleton export
export const HUDManager = new HUDManagerClass();
