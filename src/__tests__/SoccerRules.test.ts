import { SoccerRules, PlayState, Team } from '../game/SoccerRules';

describe('SoccerRules', () => {
    let rules: SoccerRules;

    beforeEach(() => {
        rules = new SoccerRules();
    });

    describe('Initial State', () => {
        it('should start in KICKOFF state', () => {
            expect(rules.playState).toBe(PlayState.KICKOFF);
        });

        it('should have score 0-0', () => {
            expect(rules.score.home).toBe(0);
            expect(rules.score.away).toBe(0);
        });

        it('should start in first half', () => {
            expect(rules.currentHalf).toBe(1);
        });
    });

    describe('startPlay()', () => {
        it('should transition to PLAYING state', () => {
            rules.startPlay();
            expect(rules.playState).toBe(PlayState.PLAYING);
        });
    });

    describe('scoreGoal()', () => {
        beforeEach(() => {
            rules.startPlay();
        });

        it('should increment home score when home scores', () => {
            rules.scoreGoal('home');
            expect(rules.score.home).toBe(1);
            expect(rules.score.away).toBe(0);
        });

        it('should increment away score when away scores', () => {
            rules.scoreGoal('away');
            expect(rules.score.home).toBe(0);
            expect(rules.score.away).toBe(1);
        });

        it('should transition to GOAL_SCORED state', () => {
            rules.scoreGoal('home');
            expect(rules.playState).toBe(PlayState.GOAL_SCORED);
        });
    });

    describe('ballOutOfBounds()', () => {
        beforeEach(() => {
            rules.startPlay();
        });

        it('should give throw-in to opposite team on sideline', () => {
            rules.ballOutOfBounds('home', 'top', { x: 10, y: 40 });
            expect(rules.playState).toBe(PlayState.OUT_OF_BOUNDS);
            expect(rules.possession).toBe('away');
        });

        it('should give corner kick when defender clears over own goal line', () => {
            rules.ballOutOfBounds('away', 'left', { x: -60, y: 0 });
            expect(rules.playState).toBe(PlayState.CORNER_KICK);
        });

        it('should give goal kick when attacker misses', () => {
            rules.ballOutOfBounds('home', 'left', { x: -60, y: 0 });
            expect(rules.playState).toBe(PlayState.GOAL_KICK);
        });
    });

    describe('callFoul()', () => {
        beforeEach(() => {
            rules.startPlay();
        });

        it('should award free kick outside penalty box', () => {
            rules.callFoul('home', { x: 0, y: 0 }, false);
            expect(rules.playState).toBe(PlayState.FREE_KICK);
            expect(rules.possession).toBe('away');
        });

        it('should award penalty inside penalty box', () => {
            rules.callFoul('home', { x: -50, y: 0 }, true);
            expect(rules.playState).toBe(PlayState.PENALTY);
            expect(rules.possession).toBe('away');
        });
    });

    describe('Match Timer', () => {
        it('should update time during PLAYING state', () => {
            rules.startPlay();
            rules.updateTime(10);
            expect(rules.matchTime).toBe(10);
        });

        it('should not update time during non-PLAYING states', () => {
            rules.updateTime(10);
            expect(rules.matchTime).toBe(0);
        });

        it('should trigger halftime at half duration', () => {
            rules.startPlay();
            rules.updateTime(rules.halfDuration);
            expect(rules.playState).toBe(PlayState.HALFTIME);
        });
    });

    describe('isInPenaltyBox()', () => {
        it('should return true for positions in left penalty box', () => {
            expect(SoccerRules.isInPenaltyBox(-55, 0)).toBe(true);
        });

        it('should return true for positions in right penalty box', () => {
            expect(SoccerRules.isInPenaltyBox(55, 0)).toBe(true);
        });

        it('should return false for center field', () => {
            expect(SoccerRules.isInPenaltyBox(0, 0)).toBe(false);
        });
    });
});
