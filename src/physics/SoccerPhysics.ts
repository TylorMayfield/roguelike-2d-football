import * as THREE from 'three';
import { InputManager } from '../core/InputManager';
import { GameManager, GameState } from '../core/GameManager';
import { SoccerRules, PlayState, Team } from '../game/SoccerRules';
import { SoccerBall } from '../game/SoccerBall';
import { SoccerField } from '../rendering/SoccerField';
import { SceneManager } from '../rendering/SceneManager';
import { SoccerPlayer, SoccerPosition, Gender } from '../game/SoccerPlayer';
import { SoccerAI } from '../ai/SoccerAI';

/**
 * SoccerPhysics - Main game loop with smooth dribbling and player stats.
 */
class SoccerPhysicsClass {
    private inputManager!: InputManager;
    private gameManager!: GameManager;
    private rules!: SoccerRules;
    private ball!: SoccerBall;
    private field!: SoccerField;
    
    // Teams
    private homePlayers: SoccerPlayer[] = [];
    private awayPlayers: SoccerPlayer[] = [];
    private homeAI: SoccerAI[] = [];
    private awayAI: SoccerAI[] = [];
    
    // Control
    private controlledPlayer: SoccerPlayer | null = null;
    private isDribbling: boolean = false;
    private dribbleOffset: THREE.Vector3 = new THREE.Vector3();
    
    // Kicking
    private isChargingKick: boolean = false;
    private kickChargeStart: number = 0;
    
    private lastTime: number = 0;
    
    public init(inputManager: InputManager, gameManager: GameManager) {
        this.inputManager = inputManager;
        this.gameManager = gameManager;
        
        this.rules = new SoccerRules();
        this.ball = new SoccerBall();
        this.field = new SoccerField(SceneManager.scene);
        
        // Add ball and its shadow to scene
        SceneManager.add(this.ball.shadow);
        SceneManager.add(this.ball.mesh);
        
        this.spawnTeams();
        
        console.log("Soccer with player stats initialized!");
    }
    
    private spawnTeams() {
        // Positions for 4-3-3
        const positions: SoccerPosition[] = [
            SoccerPosition.GK, SoccerPosition.LB, SoccerPosition.CB, SoccerPosition.CB, SoccerPosition.RB,
            SoccerPosition.LM, SoccerPosition.CM, SoccerPosition.RM,
            SoccerPosition.LW, SoccerPosition.ST, SoccerPosition.RW
        ];
        
        const homeJersey = new THREE.Color(0x0066CC);
        const awayJersey = new THREE.Color(0xCC0000);
        
        // Spawn home team
        positions.forEach((pos, i) => {
            const gender: Gender = i % 2 === 0 ? 'female' : 'male';
            const player = new SoccerPlayer('home', gender, pos, i + 1, {}, homeJersey);
            
            // Position based on formation
            const formX = this.getFormationX(pos, 'home');
            const formY = this.getFormationY(pos);
            player.setPosition(formX, formY);
            
            SceneManager.add(player.mesh);
            this.homePlayers.push(player);
            
            // AI for non-controlled players
            if (pos !== SoccerPosition.ST) {
                this.homeAI.push(new SoccerAI(player));
            }
        });
        
        // Spawn away team
        positions.forEach((pos, i) => {
            const gender: Gender = i % 2 === 1 ? 'female' : 'male';
            const player = new SoccerPlayer('away', gender, pos, i + 1, {}, awayJersey);
            
            const formX = this.getFormationX(pos, 'away');
            const formY = this.getFormationY(pos);
            player.setPosition(formX, formY);
            
            SceneManager.add(player.mesh);
            this.awayPlayers.push(player);
            this.awayAI.push(new SoccerAI(player));
        });
        
        // Control the striker
        this.controlledPlayer = this.homePlayers.find(p => p.soccerPosition === SoccerPosition.ST) || this.homePlayers[0];
        if (this.controlledPlayer) {
            this.controlledPlayer.isControlled = true;
        }
        
        console.log(`Spawned ${this.homePlayers.length} vs ${this.awayPlayers.length}`);
    }
    
    private getFormationX(pos: SoccerPosition, team: Team): number {
        const positions: Record<SoccerPosition, number> = {
            [SoccerPosition.GK]: -55, [SoccerPosition.LB]: -40, [SoccerPosition.CB]: -45,
            [SoccerPosition.RB]: -40, [SoccerPosition.CDM]: -30, [SoccerPosition.CM]: -15,
            [SoccerPosition.CAM]: -5, [SoccerPosition.LM]: -20, [SoccerPosition.RM]: -20,
            [SoccerPosition.LW]: 10, [SoccerPosition.RW]: 10, [SoccerPosition.ST]: 20
        };
        return team === 'away' ? -positions[pos] : positions[pos];
    }
    
    private getFormationY(pos: SoccerPosition): number {
        const positions: Record<SoccerPosition, number> = {
            [SoccerPosition.GK]: 0, [SoccerPosition.LB]: -25, [SoccerPosition.CB]: 0,
            [SoccerPosition.RB]: 25, [SoccerPosition.CDM]: 0, [SoccerPosition.CM]: 0,
            [SoccerPosition.CAM]: 0, [SoccerPosition.LM]: -20, [SoccerPosition.RM]: 20,
            [SoccerPosition.LW]: -25, [SoccerPosition.RW]: 25, [SoccerPosition.ST]: 0
        };
        return positions[pos];
    }
    
    public update() {
        const now = Date.now();
        const dt = Math.min(32, now - this.lastTime) / 1000;
        this.lastTime = now;
        
        if (this.gameManager.currentState !== GameState.PLAYING) return;
        
        this.rules.updateTime(dt);
        
        // Handle states
        switch (this.rules.playState) {
            case PlayState.KICKOFF: this.handleKickoff(); break;
            case PlayState.PLAYING: this.handlePlaying(dt); break;
            case PlayState.OUT_OF_BOUNDS:
            case PlayState.CORNER_KICK:
            case PlayState.GOAL_KICK:
            case PlayState.FREE_KICK: this.handleRestart(); break;
            case PlayState.HALFTIME: this.handleHalftime(); break;
        }
        
        this.ball.update(dt);
        this.checkBoundaries();
        
        // Update all players
        this.homePlayers.forEach(p => p.update(dt));
        this.awayPlayers.forEach(p => p.update(dt));
        
        // Handle player-to-player collisions
        this.handlePlayerCollisions();
        
        // Update AI with delta time for smooth movement
        const teamHasBall = this.isDribbling;
        this.homeAI.forEach(ai => ai.update(this.ball.position, teamHasBall, null, dt));
        this.awayAI.forEach(ai => ai.update(this.ball.position, !teamHasBall, null, dt));
    }
    
    private handlePlayerCollisions() {
        const allPlayers = [...this.homePlayers, ...this.awayPlayers];
        
        // Check each pair of players
        for (let i = 0; i < allPlayers.length; i++) {
            for (let j = i + 1; j < allPlayers.length; j++) {
                const p1 = allPlayers[i];
                const p2 = allPlayers[j];
                
                // Calculate distance between players
                const dx = p2.position.x - p1.position.x;
                const dy = p2.position.y - p1.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Combined collision radius (scaled by player scale of 3)
                const minDist = (p1.collisionRadius + p2.collisionRadius);
                
                if (dist < minDist && dist > 0.01) {
                    // Calculate overlap
                    const overlap = minDist - dist;
                    
                    // Normalize direction
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Push players apart (half each)
                    const pushAmount = overlap * 0.5;
                    
                    p1.position.x -= nx * pushAmount;
                    p1.position.y -= ny * pushAmount;
                    p2.position.x += nx * pushAmount;
                    p2.position.y += ny * pushAmount;
                    
                    // Update mesh positions
                    p1.mesh.position.copy(p1.position);
                    p2.mesh.position.copy(p2.position);
                    
                    // Slow down on collision
                    p1.velocity.multiplyScalar(0.8);
                    p2.velocity.multiplyScalar(0.8);
                }
            }
        }
    }
    
    private handleKickoff() {
        this.ball.reset(0, 0);
        if (this.inputManager.isKeyDown('Space')) {
            this.rules.startPlay();
            this.ball.kick(new THREE.Vector3(1, 0, 0), 0.5, 0, 'home');
        }
    }
    
    private handlePlaying(dt: number) {
        // Decay switch cooldown
        if (this.switchCooldown > 0) this.switchCooldown -= dt;
        
        this.handleMovement();
        this.handleDribbling();
        this.handleKicking();
        this.handlePlayerSwitch();
    }
    
    private handleMovement() {
        if (!this.controlledPlayer) return;
        
        let dx = 0, dy = 0;
        if (this.inputManager.isKeyDown('KeyW') || this.inputManager.isKeyDown('ArrowUp')) dy += 1;
        if (this.inputManager.isKeyDown('KeyS') || this.inputManager.isKeyDown('ArrowDown')) dy -= 1;
        if (this.inputManager.isKeyDown('KeyA') || this.inputManager.isKeyDown('ArrowLeft')) dx -= 1;
        if (this.inputManager.isKeyDown('KeyD') || this.inputManager.isKeyDown('ArrowRight')) dx += 1;
        
        const sprint = this.inputManager.isKeyDown('ShiftLeft');
        this.controlledPlayer.move(dx, dy, sprint);
    }
    
    private handleDribbling() {
        if (!this.controlledPlayer) return;
        
        const playerPos = this.controlledPlayer.position;
        const ballPos = this.ball.position;
        
        // Only check X/Y distance (ignore Z height)
        const dist2D = Math.sqrt(
            Math.pow(playerPos.x - ballPos.x, 2) + 
            Math.pow(playerPos.y - ballPos.y, 2)
        );
        
        // Control distance scaled for player size (players are 3x scale)
        const controlDist = (this.controlledPlayer.getDribbleControl() + 1.5) * 3;
        
        // Don't grab ball if it's moving fast (was just kicked)
        const ballSpeed = this.ball.velocity.length();
        const ballIsMovingFast = ballSpeed > 0.3;
        
        // Don't grab ball if it's in the air
        const ballInAir = this.ball.height > 0.5;
        
        if (dist2D < controlDist && !ballIsMovingFast && !ballInAir) {
            if (!this.isDribbling) {
                this.isDribbling = true;
                this.controlledPlayer.hasBall = true;
                this.ball.lastTouchedBy = 'home';
            }
            
            // Ball follows player with small offset based on movement
            const vel = this.controlledPlayer.velocity;
            
            // Calculate dynamic offset based on velocity
            // If stopped, keep relative direction but clamp distance
            let offsetX = vel.x * 3.0; 
            let offsetY = vel.y * 3.0;
            
            // If moving very slowly, just keep ball in front (default to current side)
            if (vel.length() < 0.01) {
                // Determine facing from current relative position
                const relX = this.ball.position.x - playerPos.x;
                const facing = relX > 0 ? 1 : -1; 
                offsetX = facing * 1.0; 
                offsetY = 0;
            }

            // Ball position in front of player
            const targetX = playerPos.x + offsetX; 
            const targetY = playerPos.y + offsetY;
            
            // Tight response - ball snaps to position faster
            const easeFactor = 0.25; 
            this.ball.position.x += (targetX - this.ball.position.x) * easeFactor;
            this.ball.position.y += (targetY - this.ball.position.y) * easeFactor;
            
            // Match velocity for continuity
            this.ball.velocity.lerp(vel, 0.3); // Inherit more velocity
            this.ball.velocity.multiplyScalar(0.9); // Damping
            
        } else if (this.isDribbling && (dist2D > controlDist * 1.5 || ballIsMovingFast)) {
            // Lost the ball - either too far or was kicked
            this.isDribbling = false;
            this.controlledPlayer.hasBall = false;
        }
    }
    
    private handleKicking() {
        if (!this.isDribbling || !this.controlledPlayer) return;
        
        // Space = power shot (charge for power + lift)
        // E = through ball (lead pass with chip)
        // F = soft ground pass
        // R = lob pass (high arc)
        
        const shooting = this.inputManager.isKeyDown('Space');
        const throughBall = this.inputManager.isKeyDown('KeyE');
        const lobPass = this.inputManager.isKeyDown('KeyR');
        
        if (shooting) {
            if (!this.isChargingKick) {
                this.isChargingKick = true;
                this.kickChargeStart = Date.now();
            }
        } else if (this.isChargingKick) {
            // Release shot - charge affects both power AND lift
            const charge = Math.min(1, (Date.now() - this.kickChargeStart) / 1000);
            const power = this.controlledPlayer.getKickPower(charge);
            
            // Quick tap = low driven shot, long hold = lofted shot
            const lift = charge * 0.4 + 0.1; // 0.1 to 0.5 based on charge
            
            const kickDir = this.getKickDirection();
            this.ball.shoot(kickDir, power, 0, 'home', lift);
            
            this.isChargingKick = false;
            this.isDribbling = false;
            this.controlledPlayer.hasBall = false;
        }
        
        // Through ball - chipped to lead the receiver
        if (throughBall && !this.isChargingKick) {
            const kickDir = this.getKickDirection();
            // Lead the pass
            kickDir.x += 0.5;
            kickDir.normalize();
            
            const power = 0.4 + this.controlledPlayer.getPassAccuracy() * 0.3; // Reduced from 0.8+
            // Chip it over defenders
            this.ball.kick(kickDir, power, 0, 'home', 0.35);
            
            this.isDribbling = false;
            this.controlledPlayer.hasBall = false;
        }
        
        // Lob pass - high arc over defense
        if (lobPass && !this.isChargingKick) {
            const kickDir = this.getKickDirection();
            const power = 0.4 + this.controlledPlayer.getPassAccuracy() * 0.2; // Reduced from 0.6+
            // High lob
            this.ball.kick(kickDir, power, 0, 'home', 0.7);
            
            this.isDribbling = false;
            this.controlledPlayer.hasBall = false;
        }
        
        // Soft pass - stays on the ground
        if (this.inputManager.isKeyDown('KeyF') && !this.isChargingKick) {
            const kickDir = this.getKickDirection();
            const power = 0.2 + this.controlledPlayer.getPassAccuracy() * 0.2; // Reduced from 0.3+
            // Ground pass - no lift
            this.ball.kick(kickDir, power, 0, 'home', 0);
            
            this.isDribbling = false;
            this.controlledPlayer.hasBall = false;
        }
    }
    
    private getKickDirection(): THREE.Vector3 {
        let dx = 0, dy = 0;
        if (this.inputManager.isKeyDown('KeyW')) dy += 1;
        if (this.inputManager.isKeyDown('KeyS')) dy -= 1;
        if (this.inputManager.isKeyDown('KeyA')) dx -= 1;
        if (this.inputManager.isKeyDown('KeyD')) dx += 1;
        
        if (dx === 0 && dy === 0) {
            // Default direction based on team
            return new THREE.Vector3(1, 0, 0);
        }
        return new THREE.Vector3(dx, dy, 0).normalize();
    }
    
    // Debounce for player switching
    private switchCooldown: number = 0;
    
    private handlePlayerSwitch() {
        // Debounce
        if (this.switchCooldown > 0) return;
        
        // Q = switch to nearest player to ball
        if (this.inputManager.isKeyDown('KeyQ')) {
            this.switchToNearestToBall();
            this.switchCooldown = 0.3;
        }
        // E = cycle to next player
        if (this.inputManager.isKeyDown('KeyE')) {
            this.cyclePlayer(1);
            this.switchCooldown = 0.3;
        }
    }
    
    private switchToNearestToBall() {
        if (!this.controlledPlayer) return;
        
        let nearest: SoccerPlayer | null = null;
        let nearestDist = Infinity;
        
        this.homePlayers.forEach(p => {
            if (p === this.controlledPlayer) return;
            const dist = p.position.distanceTo(this.ball.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = p;
            }
        });
        
        if (nearest) {
            this.doSwitch(nearest);
        }
    }
    
    private cyclePlayer(dir: number) {
        const currentIdx = this.homePlayers.indexOf(this.controlledPlayer!);
        if (currentIdx === -1) return;
        
        const nextIdx = (currentIdx + dir + this.homePlayers.length) % this.homePlayers.length;
        this.doSwitch(this.homePlayers[nextIdx]);
    }
    
    private doSwitch(newPlayer: SoccerPlayer) {
        if (this.controlledPlayer) {
            this.controlledPlayer.isControlled = false;
        }
        this.controlledPlayer = newPlayer;
        this.controlledPlayer.isControlled = true;
        
        // Also re-enable AI for old player if needed
        console.log(`Switched to #${newPlayer.number} (${newPlayer.soccerPosition})`);
    }
    
    private handleRestart() {
        this.ball.reset(this.rules.restartPosition.x, this.rules.restartPosition.y);
        if (this.inputManager.isKeyDown('Space')) {
            this.rules.startPlay();
        }
    }
    
    private handleHalftime() {
        if (this.inputManager.isKeyDown('Space')) {
            this.rules.startSecondHalf();
        }
    }
    
    private checkBoundaries() {
        if (this.rules.playState !== PlayState.PLAYING) return;
        
        const pos = this.ball.position;
        const goal = this.field.isGoal(pos.x, pos.y);
        if (goal) {
            this.rules.scoreGoal(goal);
            return;
        }
        
        const bounds = this.field.isOutOfBounds(pos.x, pos.y);
        if (bounds.out && bounds.side) {
            this.rules.ballOutOfBounds(
                this.ball.lastTouchedBy || 'home',
                bounds.side,
                { x: pos.x, y: pos.y }
            );
        }
    }
    
    // Camera target
    public getCameraTarget(): THREE.Vector3 {
        return this.controlledPlayer?.position || this.ball.position;
    }
    
    public get score() { return this.rules.score; }
    public get matchTime() { return this.rules.getFormattedTime(); }
    public get playState() { return this.rules.playState; }
}

export const SoccerPhysics = new SoccerPhysicsClass();
