import { ScoringManager } from './ScoringManager';

export enum PlayState {
  PRE_SNAP,
  SNAP,
  PLAY_ACTIVE,
  WHISTLE,
  COIN_FLIP,
  KICKOFF
}

/**
 * FootballRules - Core game state and play management.
 * Scoring logic delegated to ScoringManager.
 */
export class FootballRules {
  public down = 1;
  public distanceToFirst = 10;
  public lineOfScrimmage = -40;
  public firstDownLine = -30;
  public scoreHome = 0;
  public scoreAway = 0;
  public playState: PlayState = PlayState.COIN_FLIP;
  public possession: 'home' | 'away' = 'home';
  public kickingTeam: 'home' | 'away' = 'home';

  constructor() {
    this.resetGame();
  }

  public resetGame() {
    this.scoreHome = 0;
    this.scoreAway = 0;
    this.playState = PlayState.COIN_FLIP;
  }

  public performCoinFlip(call: 'heads' | 'tails') {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = call === result;
    
    console.log(`Coin Flip: ${result}. User called ${call}. Won: ${won}`);
    
    if (won) {
      this.possession = 'home';
      this.kickingTeam = 'away';
      console.log("Home elects to Receive.");
    } else {
      this.possession = 'away';
      this.kickingTeam = 'home';
      console.log("Away elects to Receive.");
    }

    this.setupKickoff();
  }

  public setupKickoff() {
    this.playState = PlayState.KICKOFF;
    this.lineOfScrimmage = this.kickingTeam === 'home' ? -15 : 15;
    console.log(`Kickoff! Kicking Team: ${this.kickingTeam}`);
  }

  public startNewDrive(startX: number) {
    this.lineOfScrimmage = startX;
    this.down = 1;
    this.distanceToFirst = 10;
    this.calculateFirstDownLine();
    this.playState = PlayState.WHISTLE;
  }

  public snapBall() {
    if (this.playState === PlayState.PRE_SNAP) {
      this.playState = PlayState.PLAY_ACTIVE;
      console.log("Ball Snapped!");
    }
  }

  public endPlay(endX: number) {
    if (this.playState !== PlayState.PLAY_ACTIVE && this.playState !== PlayState.KICKOFF) return;

    if (this.playState === PlayState.KICKOFF) {
      console.log("Kickoff Return Ended.");
      this.startNewDrive(endX);
      return;
    }

    const yardsGained = endX - this.lineOfScrimmage;
    console.log(`Play Ended. Gained: ${yardsGained.toFixed(1)} yards`);

    this.lineOfScrimmage = endX;

    // Check scoring conditions
    if (ScoringManager.isTouchdown(this.lineOfScrimmage)) {
      ScoringManager.scoreTouchdown(this, () => {});
      return;
    }

    if (ScoringManager.isSafety(this.lineOfScrimmage)) {
      ScoringManager.scoreSafety(this, () => {});
      return;
    }

    // Check for First Down
    if (this.lineOfScrimmage >= this.firstDownLine) {
      this.down = 1;
      this.distanceToFirst = 10;
      this.calculateFirstDownLine();
      console.log("First Down!");
    } else {
      this.down++;
      this.distanceToFirst = this.firstDownLine - this.lineOfScrimmage;
      
      if (this.down > 4) {
        ScoringManager.turnoverOnDowns(this);
        return;
      }
    }

    this.playState = PlayState.WHISTLE;
  }

  private calculateFirstDownLine() {
    this.firstDownLine = this.lineOfScrimmage + this.distanceToFirst;
    if (this.firstDownLine > 50) this.firstDownLine = 50;
  }
}
