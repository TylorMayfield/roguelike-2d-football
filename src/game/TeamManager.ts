import * as THREE from 'three';
import { SceneManager } from '../rendering/SceneManager';
import { AssetLoader } from '../rendering/AssetLoader';
import { Player, PlayerGender, PlayerSize } from './Player';
import { Defender } from './Defender';
import { Referee } from './Referee';
import { Fan } from './Fan';
import { Ball, BallState } from './Ball';
import { FootballRules } from './FootballRules';
import { PlayerSpawner } from './PlayerSpawner';
import { PositionManager, TeamEntities } from './PositionManager';

/**
 * TeamManager - Manages player spawning, formations, and positioning.
 * Now delegates to specialized modules for cleaner organization.
 */
class TeamManagerClass {
    public player!: Player;
    public defender!: Defender;
    public referee!: Referee;
    public ball!: Ball;
    public fans: Fan[] = [];
    public offensivePlayers: Player[] = [];
    public defensivePlayers: Defender[] = [];
    
    public losLine!: THREE.Mesh;
    public fdLine!: THREE.Mesh;
    public activePlayer: Player | Defender | null = null;

    /**
     * Initialize all game entities.
     */
    public init(footballRules: FootballRules) {
        const textures = AssetLoader.textures;
        const proceduralTextures = AssetLoader.proceduralTextures;
        
        // Create Ball
        this.ball = new Ball(textures['football']);
        this.ball.registerTexture(BallState.SPIRAL, proceduralTextures['ball_spiral']);
        this.ball.registerTexture(BallState.WOBBLE, proceduralTextures['ball_wobble']);
        this.ball.registerTexture(BallState.KICK, proceduralTextures['ball_kick']);
        SceneManager.add(this.ball.mesh);
        
        // Create Lines
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
        const losGeo = new THREE.PlaneGeometry(0.5, 60);
        this.losLine = new THREE.Mesh(losGeo, lineMat);
        this.losLine.position.z = 0.05;
        SceneManager.add(this.losLine);
        
        const fdMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.fdLine = new THREE.Mesh(losGeo.clone(), fdMat);
        this.fdLine.position.z = 0.05;
        SceneManager.add(this.fdLine);
        
        // Spawn entities using PlayerSpawner
        const newPlayer = PlayerSpawner.spawnMainPlayer(
            PlayerGender.MALE,
            PlayerSize.MEDIUM,
            new THREE.Color(0x00FF00)
        );
        if (newPlayer) this.player = newPlayer;
        
        this.defender = PlayerSpawner.spawnMainDefender();
        
        // Spawn referee
        this.referee = new Referee(proceduralTextures['referee']);
        this.referee.mesh.position.z = 0.1;
        SceneManager.add(this.referee.mesh);
        
        // Spawn formations
        this.offensivePlayers = PlayerSpawner.spawnOffensivePlayers();
        this.defensivePlayers = PlayerSpawner.spawnDefensivePlayers();
    }

    /**
     * Spawn/respawn the main player.
     */
    public spawnPlayer(gender: PlayerGender, size: PlayerSize, jerseyColor: THREE.Color) {
        const newPlayer = PlayerSpawner.spawnMainPlayer(gender, size, jerseyColor, this.player);
        if (newPlayer) this.player = newPlayer;
    }

    /**
     * Spawn fans in the stadium.
     */
    public spawnFans(fanTexture: THREE.Texture) {
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 120;
            const yTop = 30 + Math.random() * 10;
            const yBot = -30 - Math.random() * 10;
            
            const fanTop = new Fan(fanTexture, x, yTop);
            const fanBot = new Fan(fanTexture, x, yBot);
            this.fans.push(fanTop, fanBot);
            SceneManager.add(fanTop.mesh);
            SceneManager.add(fanBot.mesh);
        }
    }

    /**
     * Reset all positions based on game state.
     */
    public resetPositions(footballRules: FootballRules) {
        const entities: TeamEntities = {
            player: this.player,
            defender: this.defender,
            referee: this.referee,
            ball: this.ball,
            offensivePlayers: this.offensivePlayers,
            defensivePlayers: this.defensivePlayers,
            losLine: this.losLine,
            fdLine: this.fdLine
        };
        
        PositionManager.resetPositions(
            entities,
            footballRules,
            (p) => { this.activePlayer = p; },
            () => { this.updateActivePlayerRing(); }
        );
        
        if (this.activePlayer) {
            SceneManager.setCameraPosition(this.activePlayer.position.x, this.activePlayer.position.y);
        }
    }

    /**
     * Cycle through controllable players.
     */
    public cycleActivePlayer(direction: number = 1) {
        const allUserPlayers = [this.player, ...this.offensivePlayers];
        
        if (!this.activePlayer) {
            this.activePlayer = this.player;
        } else {
            const idx = allUserPlayers.indexOf(this.activePlayer as Player);
            if (idx >= 0) {
                const nextIdx = (idx + direction + allUserPlayers.length) % allUserPlayers.length;
                this.activePlayer = allUserPlayers[nextIdx];
            } else {
                this.activePlayer = this.player;
            }
        }
        
        this.updateActivePlayerRing();
    }

    /**
     * Update active player visual ring.
     */
    public updateActivePlayerRing() {
        const allUserPlayers = [this.player, ...this.offensivePlayers];
        
        allUserPlayers.forEach(p => {
            if (p) {
                p.setActive(p === this.activePlayer);
            }
        });
    }
}

export const TeamManager = new TeamManagerClass();
