import { SceneManager } from '../rendering/SceneManager';
import { Player } from './Player';
import { Defender } from './Defender';
import { Referee } from './Referee';
import { Ball } from './Ball';
import { FootballRules, PlayState } from './FootballRules';
import { OffensiveFormations, DefensiveFormations } from './Formation';
import { FootballAI, RouteType } from './FootballAI';

export interface TeamEntities {
    player: Player;
    defender: Defender;
    referee: Referee;
    ball: Ball;
    offensivePlayers: Player[];
    defensivePlayers: Defender[];
    losLine: THREE.Mesh;
    fdLine: THREE.Mesh;
}

/**
 * PositionManager - Handles player positioning for scrimmage and kickoff.
 */
export class PositionManager {
    /**
     * Reset all positions based on current game state.
     */
    public static resetPositions(
        entities: TeamEntities,
        footballRules: FootballRules,
        activePlayerSetter: (player: Player | Defender) => void,
        updateRingCallback: () => void
    ) {
        const { player, defender, offensivePlayers, defensivePlayers, referee, ball, losLine, fdLine } = entities;
        const los = footballRules.lineOfScrimmage;
        const userIsOffense = footballRules.possession === 'home';
        
        // Ball placement
        ball.mesh.position.set(los, 0, 0);
        ball.velocity.set(0, 0, 0);
        ball.mesh.rotation.set(0, 0, 0);
        
        // Check for KICKOFF formations
        if (footballRules.playState === PlayState.KICKOFF) {
            this.setupKickoffPositions(entities, footballRules, activePlayerSetter, updateRingCallback);
            return;
        }
        
        if (userIsOffense) {
            this.setupOffensePositions(entities, footballRules, activePlayerSetter);
        } else {
            this.setupDefensePositions(entities, footballRules, activePlayerSetter);
        }
        
        updateRingCallback();
        
        // Referee
        if (referee) {
            referee.setPosition(los, 20);
        }
        
        // Lines
        losLine.position.set(los, 0, 0);
        fdLine.position.set(footballRules.firstDownLine, 0, 0);
    }

    private static setupOffensePositions(
        entities: TeamEntities,
        footballRules: FootballRules,
        activePlayerSetter: (player: Player | Defender) => void
    ) {
        const { player, defender, offensivePlayers, defensivePlayers } = entities;
        const los = footballRules.lineOfScrimmage;
        
        // QB (Player)
        if (player) {
            player.setPosition(los - 5, 0);
            activePlayerSetter(player);
        }
        
        // Offensive Line (Teammates)
        const oFormation = OffensiveFormations['Shotgun'];
        const receiverKeys = ['Q', 'E', 'R', 'F'];
        let keyIndex = 0;

        offensivePlayers.forEach((p, i) => {
            const spot = oFormation[i];
            if (spot && spot.role !== 'QB') {
                p.setPosition(los + spot.x, spot.y);
                
                // Assign AI and Keys to Eligible Receivers
                if (spot.role === 'WR' || spot.role === 'TE' || spot.role === 'RB') {
                    if (!p.ai) {
                        p.ai = new FootballAI(p, RouteType.FLY);
                    }
                    if (keyIndex < receiverKeys.length) {
                        p.setAssignedKey(receiverKeys[keyIndex]);
                        keyIndex++;
                    }
                } else {
                    if (!p.ai) {
                        p.ai = new FootballAI(p, RouteType.BLOCK);
                    }
                    p.setAssignedKey('');
                }
            }
        });
        
        // Defenders (AI)
        const dFormation = DefensiveFormations['4-3'];
        defensivePlayers.forEach((d, i) => {
            const spot = dFormation[i];
            if (spot) {
                d.setPosition(los + 5 + spot.x, spot.y);
            }
        });
        
        // Main Defender
        if (defender) {
            defender.setPosition(los + 5, 0);
        }
    }

    private static setupDefensePositions(
        entities: TeamEntities,
        footballRules: FootballRules,
        activePlayerSetter: (player: Player | Defender) => void
    ) {
        const { player, defender, offensivePlayers, defensivePlayers } = entities;
        const los = footballRules.lineOfScrimmage;
        
        if (player) {
            player.setPosition(los - 5, 0);
            activePlayerSetter(player);
        }
        
        // Teammates -> Defensive Line
        offensivePlayers.forEach((p, i) => {
            const y = (i - offensivePlayers.length / 2) * 5;
            p.setPosition(los - 1, y);
        });
        
        // AI Defenders (Now Offense)
        defender.setPosition(los + 5, 0);
        
        defensivePlayers.forEach((d, i) => {
            const y = (i - defensivePlayers.length / 2) * 2;
            d.setPosition(los + 1, y);
        });
    }

    private static setupKickoffPositions(
        entities: TeamEntities,
        footballRules: FootballRules,
        activePlayerSetter: (player: Player | Defender) => void,
        updateRingCallback: () => void
    ) {
        const { player, defender, offensivePlayers, defensivePlayers } = entities;
        const kickLine = footballRules.lineOfScrimmage;
        
        if (footballRules.kickingTeam === 'home') {
            // USER KICKING
            if (player) {
                player.setPosition(kickLine - 2, 0);
                activePlayerSetter(player);
            }
            
            offensivePlayers.forEach((p, i) => {
                const y = (i - (offensivePlayers.length - 1) / 2) * 8;
                p.setPosition(kickLine - 0.5, y);
            });
            
            const returnLine = 40;
            const wedgeLine = 25;
            
            if (defender) defender.setPosition(returnLine, 0);
            
            defensivePlayers.forEach((d, i) => {
                const y = (i - (defensivePlayers.length - 1) / 2) * 10;
                d.setPosition(wedgeLine, y);
            });
        } else {
            // USER RECEIVING
            const returnLine = -40;
            const wedgeLine = -25;
            
            if (player) {
                player.setPosition(returnLine, 0);
                activePlayerSetter(player);
            }
            
            offensivePlayers.forEach((p, i) => {
                const y = (i - (offensivePlayers.length - 1) / 2) * 10;
                p.setPosition(wedgeLine, y);
            });
            
            if (defender) defender.setPosition(kickLine + 2, 0);
            
            defensivePlayers.forEach((d, i) => {
                const y = (i - (defensivePlayers.length - 1) / 2) * 8;
                d.setPosition(kickLine + 0.5, y);
            });
        }
        
        updateRingCallback();
        
        const activePlayer = player || defender;
        if (activePlayer) {
            SceneManager.setCameraPosition(activePlayer.position.x, activePlayer.position.y);
        }
    }
}
