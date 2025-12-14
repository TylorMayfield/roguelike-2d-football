import { SoccerRules, PlayState } from '../game/SoccerRules';
import { UIStore } from '../ui/UIStore';

/**
 * HUDManager - Handles all UI/HUD updates via React UIStore.
 * Updated for soccer gameplay.
 */
class HUDManagerClass {
    public init() {
        // No-op for now, store is singleton
    }

    public update(soccerRules: SoccerRules) {
        let message = '';
        
        switch (soccerRules.playState) {
            case PlayState.KICKOFF:
                message = "KICKOFF: Press SPACE to start";
                break;
            case PlayState.GOAL_SCORED:
                message = "GOAL!!!";
                break;
            case PlayState.HALFTIME:
                message = "HALFTIME - Press SPACE to continue";
                break;
            case PlayState.GAME_OVER:
                message = "FULL TIME";
                break;
            case PlayState.OUT_OF_BOUNDS:
                message = "Throw-in";
                break;
            case PlayState.CORNER_KICK:
                message = "Corner Kick";
                break;
            case PlayState.GOAL_KICK:
                message = "Goal Kick";
                break;
            case PlayState.FREE_KICK:
                message = "Free Kick";
                break;
        }

        UIStore.update({
             scoreHome: soccerRules.score.home,
             scoreAway: soccerRules.score.away,
             playStateMessage: message,
             // Soccer-specific: time instead of down/distance
             down: 0,
             distanceToFirst: 0
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

    // Kick Meter (can be used for penalty kicks later)
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
