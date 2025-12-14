import { FootballRules, PlayState } from './FootballRules';

export type Team = 'home' | 'away';

/**
 * ScoringManager - Handles all scoring events and possession changes.
 */
export class ScoringManager {
    /**
     * Handle touchdown scoring.
     */
    public static scoreTouchdown(
        rules: FootballRules,
        onScoreUpdate: (home: number, away: number) => void
    ) {
        if (rules.possession === 'home') {
            rules.scoreHome += 6;
            console.log("HOME TOUCHDOWN!");
            rules.possession = 'away';
            rules.kickingTeam = 'home';
        } else {
            rules.scoreAway += 6;
            console.log("AWAY TOUCHDOWN!");
            rules.possession = 'home';
            rules.kickingTeam = 'away';
        }
        
        onScoreUpdate(rules.scoreHome, rules.scoreAway);
        rules.setupKickoff();
    }

    /**
     * Handle safety scoring.
     */
    public static scoreSafety(
        rules: FootballRules,
        onScoreUpdate: (home: number, away: number) => void
    ) {
        if (rules.possession === 'home') {
            rules.scoreAway += 2;
            console.log("SAFETY! (Home tackled in own endzone)");
            rules.kickingTeam = 'home';
            rules.possession = 'away';
        } else {
            rules.scoreHome += 2;
            console.log("SAFETY! (Away tackled in own endzone)");
            rules.kickingTeam = 'away';
            rules.possession = 'home';
        }
        
        onScoreUpdate(rules.scoreHome, rules.scoreAway);
        rules.setupKickoff();
    }

    /**
     * Handle turnover on downs.
     */
    public static turnoverOnDowns(rules: FootballRules) {
        console.log("Turnover on Downs!");
        rules.possession = rules.possession === 'home' ? 'away' : 'home';
        rules.startNewDrive(rules.lineOfScrimmage);
    }

    /**
     * Check if position is a touchdown.
     */
    public static isTouchdown(lineOfScrimmage: number): boolean {
        return lineOfScrimmage >= 50;
    }

    /**
     * Check if position is a safety.
     */
    public static isSafety(lineOfScrimmage: number): boolean {
        return lineOfScrimmage <= -50;
    }
}
