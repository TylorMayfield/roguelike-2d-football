/**
 * SoccerRules - Core game state management for soccer.
 * Simple continuous play with goals, fouls, and out-of-bounds.
 */

export enum PlayState {
    KICKOFF,
    PLAYING,
    GOAL_SCORED,
    OUT_OF_BOUNDS,
    FOUL,
    CORNER_KICK,
    GOAL_KICK,
    FREE_KICK,
    PENALTY,
    HALFTIME,
    GAME_OVER
}

export type Team = 'home' | 'away';

export interface SoccerScore {
    home: number;
    away: number;
}

/**
 * SoccerRules - Manages match state, scoring, and game flow.
 */
export class SoccerRules {
    public playState: PlayState = PlayState.KICKOFF;
    public possession: Team = 'home';
    public score: SoccerScore = { home: 0, away: 0 };
    
    // Match timer (in seconds, scaled)
    public matchTime: number = 0;
    public readonly halfDuration: number = 180; // 3 min real time = 45 min game time
    public currentHalf: 1 | 2 = 1;
    
    // Ball position for restart
    public restartPosition = { x: 0, y: 0 };
    
    // Last touch for out-of-bounds
    public lastTouch: Team = 'home';
    
    constructor() {
        this.resetMatch();
    }
    
    public resetMatch() {
        this.playState = PlayState.KICKOFF;
        this.possession = 'home';
        this.score = { home: 0, away: 0 };
        this.matchTime = 0;
        this.currentHalf = 1;
        this.restartPosition = { x: 0, y: 0 };
    }
    
    /**
     * Start kickoff - called after goal or at match start
     */
    public startKickoff(kickingTeam: Team) {
        this.playState = PlayState.KICKOFF;
        this.possession = kickingTeam;
        this.restartPosition = { x: 0, y: 0 };
        console.log(`Kickoff: ${kickingTeam}`);
    }
    
    /**
     * Start play after any stoppage
     */
    public startPlay() {
        if (this.playState !== PlayState.PLAYING) {
            this.playState = PlayState.PLAYING;
            console.log("Play Active!");
        }
    }
    
    /**
     * Goal scored!
     */
    public scoreGoal(scoringTeam: Team) {
        if (scoringTeam === 'home') {
            this.score.home++;
            console.log(`GOAL! Home ${this.score.home} - ${this.score.away} Away`);
        } else {
            this.score.away++;
            console.log(`GOAL! Home ${this.score.home} - ${this.score.away} Away`);
        }
        
        this.playState = PlayState.GOAL_SCORED;
        
        // Conceding team gets kickoff
        const kickingTeam = scoringTeam === 'home' ? 'away' : 'home';
        
        // Delay then restart
        setTimeout(() => {
            this.startKickoff(kickingTeam);
        }, 2000);
    }
    
    /**
     * Ball went out of bounds
     */
    public ballOutOfBounds(lastTouchedBy: Team, exitSide: 'top' | 'bottom' | 'left' | 'right', position: { x: number, y: number }) {
        this.lastTouch = lastTouchedBy;
        this.restartPosition = position;
        
        const restartTeam = lastTouchedBy === 'home' ? 'away' : 'home';
        this.possession = restartTeam;
        
        if (exitSide === 'left' || exitSide === 'right') {
            // Goal line - corner or goal kick
            const isCorner = (exitSide === 'left' && lastTouchedBy === 'away') ||
                           (exitSide === 'right' && lastTouchedBy === 'home');
            
            if (isCorner) {
                this.playState = PlayState.CORNER_KICK;
                console.log(`Corner kick: ${restartTeam}`);
            } else {
                this.playState = PlayState.GOAL_KICK;
                console.log(`Goal kick: ${restartTeam}`);
            }
        } else {
            // Sideline - throw in
            this.playState = PlayState.OUT_OF_BOUNDS;
            console.log(`Throw-in: ${restartTeam}`);
        }
    }
    
    /**
     * Foul committed
     */
    public callFoul(foulingTeam: Team, position: { x: number, y: number }, inPenaltyBox: boolean) {
        const fouledTeam = foulingTeam === 'home' ? 'away' : 'home';
        this.possession = fouledTeam;
        this.restartPosition = position;
        
        if (inPenaltyBox) {
            this.playState = PlayState.PENALTY;
            console.log(`PENALTY! ${fouledTeam} awarded penalty kick`);
        } else {
            this.playState = PlayState.FREE_KICK;
            console.log(`Free kick: ${fouledTeam}`);
        }
    }
    
    /**
     * Update match timer
     */
    public updateTime(deltaSeconds: number) {
        if (this.playState === PlayState.PLAYING) {
            this.matchTime += deltaSeconds;
            
            // Check for halftime/fulltime
            if (this.currentHalf === 1 && this.matchTime >= this.halfDuration) {
                this.playState = PlayState.HALFTIME;
                console.log("HALFTIME!");
            } else if (this.currentHalf === 2 && this.matchTime >= this.halfDuration * 2) {
                this.playState = PlayState.GAME_OVER;
                console.log("FULL TIME!");
            }
        }
    }
    
    /**
     * Start second half
     */
    public startSecondHalf() {
        this.currentHalf = 2;
        // Away team kicks off second half
        this.startKickoff('away');
    }
    
    /**
     * Get formatted match time (MM:SS game time)
     */
    public getFormattedTime(): string {
        // Scale to 90 min match
        const gameMinutes = Math.floor((this.matchTime / this.halfDuration) * 45);
        const adjustedMinutes = this.currentHalf === 2 ? gameMinutes + 45 : gameMinutes;
        const displayMin = Math.min(adjustedMinutes, this.currentHalf === 1 ? 45 : 90);
        return `${displayMin}'`;
    }
    
    /**
     * Check if ball position is in penalty box
     */
    public static isInPenaltyBox(x: number, y: number, fieldWidth: number = 120, fieldHeight: number = 54): boolean {
        const penaltyBoxWidth = 18;
        const penaltyBoxHeight = 40;
        const halfHeight = fieldHeight / 2;
        const halfWidth = fieldWidth / 2;
        
        // Left penalty box
        if (x < -halfWidth + penaltyBoxWidth && Math.abs(y) < penaltyBoxHeight / 2) {
            return true;
        }
        // Right penalty box  
        if (x > halfWidth - penaltyBoxWidth && Math.abs(y) < penaltyBoxHeight / 2) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if ball is in goal
     */
    public static isGoal(x: number, y: number, fieldWidth: number = 120): boolean {
        const goalWidth = 7.32; // Standard goal width scaled
        const halfWidth = fieldWidth / 2;
        
        if (Math.abs(y) < goalWidth / 2) {
            if (x <= -halfWidth) return true; // Left goal
            if (x >= halfWidth) return true;  // Right goal
        }
        
        return false;
    }
}
