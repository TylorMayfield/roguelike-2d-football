import { FootballRules, PlayState } from '../game/FootballRules';

describe('FootballRules', () => {
    let rules: FootballRules;

    beforeEach(() => {
        rules = new FootballRules();
    });

    describe('Initial State', () => {
        it('should start at COIN_FLIP state', () => {
            expect(rules.playState).toBe(PlayState.COIN_FLIP);
        });

        it('should have score 0-0', () => {
            expect(rules.scoreHome).toBe(0);
            expect(rules.scoreAway).toBe(0);
        });
    });

    describe('performCoinFlip()', () => {
        it('should transition to KICKOFF state', () => {
            rules.performCoinFlip('heads');
            expect(rules.playState).toBe(PlayState.KICKOFF);
        });

        it('should sets possession correctly', () => {
            rules.performCoinFlip('heads');
            // Can't deterministic test win/loss with random, but possession should be set
            expect(['home', 'away']).toContain(rules.possession);
        });
    });

    describe('Game Flow', () => {
        // Fast forward to gameplay
        beforeEach(() => {
            rules.possession = 'home';
            rules.startNewDrive(-40);
            // Must manually move to PRE_SNAP because startNewDrive sets it to WHISTLE
            rules.playState = PlayState.PRE_SNAP;
        });

        it('should transition from PRE_SNAP to PLAY_ACTIVE', () => {
            rules.snapBall();
            expect(rules.playState).toBe(PlayState.PLAY_ACTIVE);
        });

        it('should award first down on 10+ yard gain', () => {
            rules.snapBall();
            const startLOS = rules.lineOfScrimmage;
            rules.endPlay(startLOS + 12); 
            
            expect(rules.down).toBe(1);
            expect(rules.distanceToFirst).toBe(10);
        });

        it('should progress downs', () => {
            rules.snapBall();
            rules.endPlay(rules.lineOfScrimmage + 2);
            expect(rules.down).toBe(2);
        });
        
        it('should turnover on downs', () => {
            for (let i = 0; i < 4; i++) {
                rules.playState = PlayState.PRE_SNAP; // Simulating Game Manager update
                rules.snapBall();
                rules.endPlay(rules.lineOfScrimmage + 1); // Only 1 yard each play
            }
            // Should prompt change of possession
            expect(rules.possession).toBe('away');
        });

        it('should score touchdown and setup kickoff', () => {
            rules.snapBall();
            rules.endPlay(55); // Score
            
            expect(rules.scoreHome).toBe(6);
            expect(rules.playState).toBe(PlayState.KICKOFF);
            expect(rules.kickingTeam).toBe('home'); // Home just scored, so they kick
        });
    });
});
