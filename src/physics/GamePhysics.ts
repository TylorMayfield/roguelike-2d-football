import * as THREE from 'three';
import { InputManager } from '../core/InputManager';
import { GameManager, GameState } from '../core/GameManager';
import { FootballRules, PlayState } from '../game/FootballRules';
import { TeamManager } from '../game/TeamManager';
import { HUDManager } from '../rendering/HUDManager';
import { SceneManager } from '../rendering/SceneManager';
import { TileMap } from '../game/TileMap';
import { PlayerGender, PlayerSize } from '../game/Player';

/**
 * GamePhysics - Handles all game update logic, movement, collisions.
 */
class GamePhysicsClass {
    private inputManager!: InputManager;
    private gameManager!: GameManager;
    private footballRules!: FootballRules;
    private tileMap!: TileMap;
    
    public currentPlaySelected = false;
    public currentPlayType: 'run' | 'pass' = 'run';
    public isCarryingBall = false;

    // Kick Meter State
    private kickMeterActive = false;
    private kickPower = 0;
    private kickPhase: 'power' | 'accuracy' | 'done' = 'power';
    private kickAccuracyPosition = 0.5;
    private kickAccuracyDirection = 1;
    private kickStartTime = 0;

    public init(
        inputManager: InputManager,
        gameManager: GameManager,
        footballRules: FootballRules,
        tileMap: TileMap
    ) {
        this.inputManager = inputManager;
        this.gameManager = gameManager;
        this.footballRules = footballRules;
        this.tileMap = tileMap;
        
        // Set up play picker listener (React UI)
        window.addEventListener('play:selected', (e: any) => {
            const playType = e.detail.playType;
            this.currentPlaySelected = true;
            this.currentPlayType = playType;
            HUDManager.hidePlayPicker();
            console.log(`Play Selected: ${playType}`);
        });
    }

    private lastPlayEndTime = 0;
    private lastCycleTime = 0;

    public update() {
        const { defender, ball, offensivePlayers, defensivePlayers } = TeamManager;
        const player = TeamManager.activePlayer; // Control the active player

        // Handle Coin Flip
        if (this.footballRules.playState === PlayState.COIN_FLIP) {
            if (this.inputManager.isKeyDown('KeyH')) {
                this.footballRules.performCoinFlip('heads');
            } else if (this.inputManager.isKeyDown('KeyT')) {
                this.footballRules.performCoinFlip('tails');
            }
            return;
        }
        
        // Handle Kickoff
        if (this.footballRules.playState === PlayState.KICKOFF) {
             // If User is Kicking
             if (this.footballRules.kickingTeam === 'home') {
                 // Show kick meter if not active
                 if (!this.kickMeterActive) {
                     this.kickMeterActive = true;
                     this.kickPhase = 'power';
                     this.kickPower = 0;
                     this.kickAccuracyPosition = 0.5;
                     this.kickAccuracyDirection = 1;
                     this.kickStartTime = Date.now();
                     HUDManager.showKickMeter();
                 }

                 // Power Phase - Hold Space to charge
                 if (this.kickPhase === 'power') {
                     if (this.inputManager.isKeyDown('Space') || this.inputManager.isKeyDown('KeyK')) {
                         // Charge power (0 to 1 over ~1.5 seconds)
                         const elapsed = (Date.now() - this.kickStartTime) / 1500;
                         this.kickPower = Math.min(1, elapsed);
                         HUDManager.updateKickMeter(this.kickPower, 'power', this.kickAccuracyPosition);
                     } else if (this.kickPower > 0) {
                         // Released - move to accuracy phase
                         this.kickPhase = 'accuracy';
                         this.kickStartTime = Date.now();
                         HUDManager.updateKickMeter(this.kickPower, 'accuracy', this.kickAccuracyPosition);
                     }
                 }

                 // Accuracy Phase - Moving marker, release to set
                 if (this.kickPhase === 'accuracy') {
                     // Oscillate accuracy marker
                     const elapsed = (Date.now() - this.kickStartTime) / 1000;
                     this.kickAccuracyPosition = 0.5 + Math.sin(elapsed * 6) * 0.5; // Fast oscillation
                     HUDManager.updateKickMeter(this.kickPower, 'accuracy', this.kickAccuracyPosition);

                     // Check for release (Space NOT pressed)
                     if (this.inputManager.isKeyDown('Space') || this.inputManager.isKeyDown('KeyK')) {
                         // Set accuracy and kick
                         this.kickPhase = 'done';
                         HUDManager.updateKickMeter(this.kickPower, 'done', this.kickAccuracyPosition);

                         // Calculate kick direction based on accuracy
                         const accuracyOffset = (this.kickAccuracyPosition - 0.5) * 0.5; // -0.25 to +0.25
                         const kickDir = new THREE.Vector3(1, accuracyOffset, 0).normalize();
                         const power = 0.5 + this.kickPower * 0.5; // 0.5 to 1.0

                         ball.kick(kickDir, power);
                         this.footballRules.playState = PlayState.PLAY_ACTIVE;
                         console.log(`Kickoff! Power: ${(this.kickPower * 100).toFixed(0)}%, Accuracy: ${((1 - Math.abs(this.kickAccuracyPosition - 0.5) * 2) * 100).toFixed(0)}%`);

                         // Reset and hide meter
                         setTimeout(() => {
                             HUDManager.hideKickMeter();
                             this.kickMeterActive = false;
                         }, 500);
                     }
                 }
             } else {
                 // AI Kicking (Away)
                 if (Math.random() < 0.05) {
                     const kickDir = new THREE.Vector3(-1, (Math.random() - 0.5) * 0.2, 0).normalize();
                     ball.kick(kickDir, 0.7 + Math.random() * 0.2);
                     this.footballRules.playState = PlayState.PLAY_ACTIVE;
                     console.log("AI Kickoff!");
                 }
             }
             return;
        }

        if (this.gameManager.currentState !== GameState.PLAYING || !player || !defender) return;

        // Player Cycling
        // Q: Previous, E: Next
        if (this.inputManager.isKeyDown('KeyE')) {
            if (Date.now() - this.lastCycleTime > 200) {
                TeamManager.cycleActivePlayer(1);
                this.lastCycleTime = Date.now();
            }
        }
        if (this.inputManager.isKeyDown('KeyQ')) {
            if (Date.now() - this.lastCycleTime > 200) {
                TeamManager.cycleActivePlayer(-1);
                this.lastCycleTime = Date.now();
            }
        }

        // Tackle Action
        if (this.inputManager.isKeyDown('KeyF')) {
            // Cooldown for action?
             if (!player.isActing) { // Assuming public accessor or check
                 player.playAction('tackle');
                 // Check collision with Ball Carrier (if defending) or Defender (if attacking?)
                 // Usually tackle logic: User Defending -> Tackles AI Ball Carrier
                 // Tackle physics check below
             }
        }
        // Legacy Tab support
        if (this.inputManager.isKeyDown('Tab')) {
            if (Date.now() - this.lastCycleTime > 200) {
                TeamManager.cycleActivePlayer(1);
                this.lastCycleTime = Date.now();
            }
        }

        // Handle Play State
        if (this.footballRules.playState === PlayState.PRE_SNAP) {
            if (!this.currentPlaySelected) {
                HUDManager.showPlayPicker();
                return;
            }
            
            // Cooldown before next snap (prevent accidental double snaps)
            if (Date.now() - this.lastPlayEndTime < 1000) {
                return;
            }
            
            // Allow Snap (Only if Offense?)
            if (this.footballRules.possession === 'home') {
                if (this.inputManager.isKeyDown('Space') || this.inputManager.isButtonDown(0)) {
                    this.footballRules.snapBall();
                    ball.mesh.position.copy(player.position);
                    ball.mesh.position.x += 0.3;
                    ball.velocity.set(0, 0, 0);
                    this.isCarryingBall = true;
                }
            } else {
                // AI Snap logic?
                // For now, auto-snap after delay
                 if (Date.now() - this.lastPlayEndTime > 2000) {
                    this.footballRules.snapBall();
                    // Give ball to AI QB (defender?)
                    // Actually, if Possession is Away, Defender is the QB.
                    // But Defender entity doesn't have "active" logic the same way.
                    // Let's attach ball to Defender?
                    ball.mesh.position.copy(defender.mesh.position);
                    // AI QB logic handled in updateFormations or separate AI controller.
                }
            }
            // return; // Allow fall-through for movement
        }
        
        if (this.footballRules.playState === PlayState.WHISTLE) {
            this.footballRules.playState = PlayState.PRE_SNAP;
            this.currentPlaySelected = false;
            this.isCarryingBall = false;
            TeamManager.resetPositions(this.footballRules);
            this.lastPlayEndTime = Date.now();
            return;
        }

        // --- Normal Movement & Physics ---
        // Allow movement if play is selected (PRE_SNAP) or during play (PLAY_ACTIVE)
        let canMove = false;
        if (this.footballRules.playState === PlayState.PLAY_ACTIVE) canMove = true;
        if (this.footballRules.playState === PlayState.PRE_SNAP && this.currentPlaySelected) canMove = true;
        
        if (canMove) {
            let dx = 0;
            let dy = 0;

            if (this.inputManager.isKeyDown('KeyW') || this.inputManager.isKeyDown('ArrowUp')) dy += 1;
            if (this.inputManager.isKeyDown('KeyS') || this.inputManager.isKeyDown('ArrowDown')) dy -= 1;
            if (this.inputManager.isKeyDown('KeyA') || this.inputManager.isKeyDown('ArrowLeft')) dx -= 1;
            if (this.inputManager.isKeyDown('KeyD') || this.inputManager.isKeyDown('ArrowRight')) dx += 1;

            const axisX = this.inputManager.getAxis(0);
            const axisY = this.inputManager.getAxis(1);
            if (Math.abs(axisX) > 0.1) dx = axisX;
            if (Math.abs(axisY) > 0.1) dy = -axisY;

            player.move(dx, dy);
            player.update(16);
        }
        
        // Swap Skins (Debug)
        if (this.inputManager.isKeyDown('Digit1')) TeamManager.spawnPlayer(PlayerGender.MALE, PlayerSize.SMALL, new THREE.Color(0x00FF00));
        
        // Defender Logic & Tackle Detection
        if (this.footballRules.playState === PlayState.PLAY_ACTIVE) {
            // If User is Offense, Defenders chase User
            if (this.footballRules.possession === 'home') {
                 defender.updateAI(player.position, true);
                 
                 // Check tackle from main defender
                 if (player.position.distanceTo(defender.mesh.position) < 0.8) {
                     this.footballRules.endPlay(player.position.x);
                     return;
                 }
                 
                 for (const d of defensivePlayers) {
                     // AI Defenders should update AI logic?
                     // Wait, defensivePlayers are of type 'Defender'.
                     // So they have updateAI now.
                     d.updateAI(player.position, true);
                     
                     if (player.position.distanceTo(d.mesh.position) < 0.6) {
                         this.footballRules.endPlay(player.position.x);
                         return;
                     }
                 }
            } else {
                 // User is Defense.
                 // AI (Defender entity) has ball.
                 // User (player entity) tries to tackle.
                 
                 // Move logic for AI QB?
                 // Simple AI: Run forward (-x)
                 defender.updateAI(new THREE.Vector3(-60, defender.mesh.position.y, 0), true);
                 
                 // Ball on Defender
                 // If AI has ball logic... 
                 ball.mesh.position.copy(defender.mesh.position);
                 
                 // Check if User tackled AI
                 if (player.position.distanceTo(defender.mesh.position) < 0.8) {
                      this.footballRules.endPlay(defender.mesh.position.x); // Spot is where ball carrier died
                      return;
                 }
            }

        } else {
            defender.updateAI(player.position, false);
        }

        // Action Inputs (Kick/Throw) - Only if carrying ball or relevant
        if (this.footballRules.playState === PlayState.PLAY_ACTIVE && this.footballRules.possession === 'home') {
             // Ball Kick
            if (this.inputManager.isKeyDown('KeyK')) {
                const dist = player.position.distanceTo(ball.mesh.position);
                if (dist < 1.0) {
                    const kickDir = new THREE.Vector3().subVectors(ball.mesh.position, player.position).normalize();
                    if (kickDir.length() === 0) kickDir.set(1, 0, 0);
                    player.playAction('kick');
                    ball.kick(kickDir, 0.4);
                    this.isCarryingBall = false;
                }
            }
            
            // Ball Throw
            if (this.inputManager.isKeyDown('Space') && this.isCarryingBall) {
                player.playAction('throw');
                ball.throw(new THREE.Vector3(1, 0, 0), 0.6, true);
                this.isCarryingBall = false;
            }
        
            // Ball Carrying Logic
            if (this.isCarryingBall) {
                ball.mesh.position.copy(player.position);
                ball.mesh.position.x += 0.3;
                ball.velocity.set(0, 0, 0);
            } else {
                const dist = player.position.distanceTo(ball.mesh.position);
                if (dist < 0.8) {
                    this.isCarryingBall = true;
                }
                ball.update(16);
            }
        } else {
             // Ball update if loose
             if (this.footballRules.playState === PlayState.PLAY_ACTIVE) {
                 ball.update(16);
                 
                 // Check if any teammate catches the ball
                 if (this.footballRules.possession === 'home') {
                      offensivePlayers.forEach(p => {
                          const dist = p.position.distanceTo(ball.mesh.position);
                          if (dist < 0.8) {
                              // Catch!
                              console.log("Catch by teammate!");
                              TeamManager.activePlayer = p; // Switch control
                              this.isCarryingBall = true;
                              TeamManager.updateActivePlayerRing();
                              // Camera update handled in main loop
                              
                              // If it was a catch, maybe boost speed or something?
                              // For now, just standard carry.
                          }
                      });
                      
                      // Also check if original player (if they threw it and ran after it?)
                      // Actually, if we switched away, player is just another teammate? 
                      // No, TeamManager.player is consistently the QB/Main Char.
                      // But activePlayer can be anyone. 
                      // The loop above iterates offensivePlayers. TeamManager.player is NOT in offensivePlayers list usually?
                      // Wait, TeamManager.ts: "spawnPlayer" sets this.player. "offensivePlayers" are teammates.
                      // So yes, we need to check this.player separately if they are not active?
                      
                      if (TeamManager.player !== TeamManager.activePlayer) {
                          const dist = TeamManager.player.position.distanceTo(ball.mesh.position);
                          if (dist < 0.8) {
                              TeamManager.activePlayer = TeamManager.player;
                              this.isCarryingBall = true;
                              TeamManager.updateActivePlayerRing();
                          }
                      }
                 }
             } else {
                 ball.update(16);
             }
        }

        // Manual Tackle (T key) - Always available?
        if (this.inputManager.isKeyDown('KeyT')) {
            player.playAction('tackle');
        }
        
        // Bounds Check
        if (player.position.y > 26.5 || player.position.y < -26.5) {
            if (this.footballRules.playState === PlayState.PLAY_ACTIVE) {
                 if (this.footballRules.possession === 'home') {
                    console.log("Out of Bounds!");
                    this.footballRules.endPlay(player.position.x);
                 } else {
                     // AI Out of bounds
                     this.footballRules.endPlay(defender.mesh.position.x);
                 }
            }
        }

        // Clamp Player Position
        if (player.position.x > 60) player.setPosition(60, player.position.y);
        if (player.position.x < -60) player.setPosition(-60, player.position.y);
    }

    public updateFormations() {
        const { player, defender, offensivePlayers, defensivePlayers, ball } = TeamManager;
        const allDefenders = [defender, ...defensivePlayers];

        // Offensive Players - AI & Blocking
        offensivePlayers.forEach(p => {
             // Pass Input Handling (if User has ball and plays key)
             if (this.footballRules.playState === PlayState.PLAY_ACTIVE && 
                 this.footballRules.possession === 'home' &&
                 this.isCarryingBall && 
                 p.assignedKey) {
                 
                 // If Key Pressed
                 if (this.inputManager.isKeyDown('Key' + p.assignedKey)) { // e.g. KeyQ, KeyE
                     console.log(`Throwing to ${p.assignedKey}`);
                     // Calculate Throw Vector
                     const throwDir = new THREE.Vector3().subVectors(p.position, player.position).normalize();
                     
                     player.playAction('throw');
                     ball.throw(throwDir, 0.6, true);
                     this.isCarryingBall = false;
                 }
             }

            if (this.footballRules.playState === PlayState.PLAY_ACTIVE) {
                 // Update AI Route or Block
                 if (p.ai) {
                     p.ai.update(this.footballRules);
                 }
                 
                 // Fallback Blocking Logic if no AI or AI is Blocking
                 // ... (keep existing simple blocking logic for linemen if they have BLOCK route implied)
                 // actually FootballAI handles movement now. 
                 // If we want linemen to use old logic, we can keep it if route is BLOCK?
                 // Let's assume FootballAI handles it or we mix. 
                 // For safety, let's keep the blocking logic for players WITHOUT FootballAI (or explicitly BLOCK)
                 
                 if (!p.ai || (p.ai && p.ai.route === 'block')) { // Checking 'block' string might fail if enum mismatch? 
                     // Just use existing logic for now for non-receivers
                     // Find nearest defender
                     let nearestDist = Infinity;
                     let nearestDef: any = null;
                     
                     for(const d of allDefenders) {
                         const dist = p.position.distanceTo(d.mesh.position);
                         if(dist < nearestDist) {
                             nearestDist = dist;
                             nearestDef = d;
                         }
                     }
                     
                     // If close to a defender, move to intercept and Block
                     if (nearestDef && nearestDist < 5.0) {
                         // Move towards them to block
                         const moveDir = new THREE.Vector3().subVectors(nearestDef.mesh.position, p.position).normalize();
                         p.move(moveDir.x, moveDir.y);
                         
                         // Block check (Play Block Action if close)
                         if (nearestDist < 2.0) {
                            p.playAction('block');
                            
                            // Push defender back strongly while blocking
                            const pushDir = new THREE.Vector3()
                                .subVectors(nearestDef.mesh.position, p.position)
                                .normalize()
                                .multiplyScalar(0.15); // Increased push
                            nearestDef.mesh.position.add(pushDir);
                         }
                     }
                 }
            } else {
                // If not active, reset or idle
                 p.update(16);
            }
            // Always update animation/visuals
            // p.update(16) already called above in else? no, need to call it always.
            if (this.footballRules.playState === PlayState.PLAY_ACTIVE) p.update(16);
        });
        
        // Defensive Players - Chase & Tackle
        defensivePlayers.forEach(d => {
            if (this.footballRules.playState === PlayState.PLAY_ACTIVE && player) {
                d.updateAI(player.position, true);
                
                // Tackle Animation if close
                if (player.position.distanceTo(d.mesh.position) < 1.5) {
                    d.playAction('tackle');
                }
                
            } else {
                d.updateAI(new THREE.Vector3(), false);
            }
        });
        
        // Main Defender Tackle Animation
        if (defender && player &&  this.footballRules.playState === PlayState.PLAY_ACTIVE) {
             if (player.position.distanceTo(defender.mesh.position) < 1.5) {
                defender.playAction('tackle');
             }
        }
        
        // Manual User Tackle Check (F key effect)
        // If User plays tackle action, check strict collision
        if (player && player.isActing && player.currentAction === 'tackle') {
            // Check Front collision
            // Get player direction from input inputs? Or just check surrounding area?
            // Simple check: Any opponent within range
            
            // Check Main Defender
            if (player.position.distanceTo(defender.mesh.position) < 1.0) {
                 // Success Tackle
                 // If defender has ball, stop play
                 if (this.footballRules.possession === 'away') {
                     this.footballRules.endPlay(defender.mesh.position.x);
                 }
            }
            // Check AI Players?
        }
    }
}

// Singleton export
export const GamePhysics = new GamePhysicsClass();
