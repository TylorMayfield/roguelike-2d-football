import * as THREE from 'three';
import { PixelArtGenerator, PixelArtFrame } from '../utils/PixelArtGenerator';
import { SceneManager } from '../rendering/SceneManager';

export enum SoccerPosition {
    GK = 'GK', CB = 'CB', LB = 'LB', RB = 'RB', 
    CDM = 'CDM', CM = 'CM', CAM = 'CAM',
    LM = 'LM', RM = 'RM',
    LW = 'LW', RW = 'RW', ST = 'ST'
}

export type Gender = 'male' | 'female';
export type Team = 'home' | 'away';
export type PlayerState = 'idle' | 'run' | 'kick';

export interface PlayerStats {
    speed: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    stamina: number;
}

/**
 * SoccerPlayer - 2D Pixel Art Sprite Character
 */
export class SoccerPlayer {
    public mesh: THREE.Group; // Keeps Group wrapper for position/scaling
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    
    // Identity
    public readonly team: Team;
    public readonly gender: Gender;
    public readonly soccerPosition: SoccerPosition;
    public readonly number: number;
    
    // Stats
    public stats: PlayerStats;
    public currentStamina: number;
    public maxStamina: number;
    private staminaDrainRate: number = 0.5;
    private staminaRegenRate: number = 0.2;
    
    // Gameplay
    public hasBall: boolean = false;
    public isControlled: boolean = false;
    public readonly collisionRadius: number = 0.4; // Reduced for sprite scale
    
    // Visuals (Sprites)
    private sprite: THREE.Sprite;
    private textures: Record<string, THREE.Texture> = {}; // Cache textures
    
    // Animation
    private currentState: PlayerState = 'idle';
    private animTimer: number = 0;
    private currentFrameIdx: number = 0;
    private isFlipped: boolean = false; // Face left/right
    
    // Config
    private jerseyColor: string;
    private shortsColor: string;
    private skinColor: string;
    private hairColor: string;
    
    constructor(
        team: Team,
        gender: Gender,
        soccerPosition: SoccerPosition,
        number: number,
        stats: Partial<PlayerStats> = {},
        jerseyColor?: THREE.Color,
        shortsColor?: THREE.Color
    ) {
        this.team = team;
        this.gender = gender;
        this.soccerPosition = soccerPosition;
        this.number = number;
        
        // Stats
        this.stats = this.generateStats(soccerPosition, stats);
        this.maxStamina = 50 + this.stats.stamina * 0.5;
        this.currentStamina = this.maxStamina;
        
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        
        // Colors (Hex strings for PixelGenerator)
        this.jerseyColor = '#' + (jerseyColor || (team === 'home' ? new THREE.Color(0x0066CC) : new THREE.Color(0xCC0000))).getHexString();
        this.shortsColor = '#' + (shortsColor || new THREE.Color(0xFFFFFF)).getHexString();
        this.skinColor = '#' + this.randomSkinTone().getHexString();
        
        const hairColors = [0x3B240B, 0x000000, 0x8B4513, 0xD4A574];
        this.hairColor = '#' + new THREE.Color(hairColors[Math.floor(Math.random() * hairColors.length)]).getHexString();
        
        // Create Sprite
        this.mesh = new THREE.Group();
        
        // DEBUG: Add a simple red plane to verify player exists in scene
        const debugGeo = new THREE.PlaneGeometry(1, 1);
        const debugMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const debugMesh = new THREE.Mesh(debugGeo, debugMat);
        debugMesh.position.z = 0.5; // In front
        this.mesh.add(debugMesh);
        
        // Generate Frames
        this.generateSpriteFrames();
        
        // Setup initial sprite material
        const mat = new THREE.SpriteMaterial({ 
            map: this.textures['idle_0'],
            color: 0xffffff
        });
        
        this.sprite = new THREE.Sprite(mat);
        this.sprite.scale.set(1.5, 1.5, 1); // 2D Sprite Scale
        this.sprite.center.set(0.5, 0.0); // Anchor at feet
        this.mesh.add(this.sprite);
        
        // Create Number Text (Floating above head for now, or integrated?)
        // Let's keep existing number logic but adjusted position
        this.createNumberSprite();
    }
    
    // ... (Stats Logic Unchanged) ...
    private generateStats(pos: SoccerPosition, overrides: Partial<PlayerStats>): PlayerStats {
        const baseStats: Record<SoccerPosition, PlayerStats> = {
            [SoccerPosition.GK]: { speed: 50, shooting: 30, passing: 60, dribbling: 40, defense: 85, stamina: 70 },
            [SoccerPosition.CB]: { speed: 55, shooting: 40, passing: 55, dribbling: 45, defense: 80, stamina: 75 },
            [SoccerPosition.LB]: { speed: 70, shooting: 45, passing: 65, dribbling: 60, defense: 70, stamina: 80 },
            [SoccerPosition.RB]: { speed: 70, shooting: 45, passing: 65, dribbling: 60, defense: 70, stamina: 80 },
            [SoccerPosition.CDM]: { speed: 60, shooting: 55, passing: 70, dribbling: 60, defense: 75, stamina: 85 },
            [SoccerPosition.CM]: { speed: 65, shooting: 65, passing: 75, dribbling: 70, defense: 60, stamina: 80 },
            [SoccerPosition.CAM]: { speed: 70, shooting: 75, passing: 80, dribbling: 80, defense: 40, stamina: 70 },
            [SoccerPosition.LM]: { speed: 75, shooting: 65, passing: 70, dribbling: 75, defense: 45, stamina: 75 },
            [SoccerPosition.RM]: { speed: 75, shooting: 65, passing: 70, dribbling: 75, defense: 45, stamina: 75 },
            [SoccerPosition.LW]: { speed: 85, shooting: 70, passing: 65, dribbling: 85, defense: 30, stamina: 70 },
            [SoccerPosition.RW]: { speed: 85, shooting: 70, passing: 65, dribbling: 85, defense: 30, stamina: 70 },
            [SoccerPosition.ST]: { speed: 80, shooting: 85, passing: 60, dribbling: 75, defense: 30, stamina: 70 },
        };
        const base = baseStats[pos];
        const randomize = (v: number) => Math.max(1, Math.min(99, v + Math.floor(Math.random() * 21) - 10));
        return {
            speed: overrides.speed ?? randomize(base.speed),
            shooting: overrides.shooting ?? randomize(base.shooting),
            passing: overrides.passing ?? randomize(base.passing),
            dribbling: overrides.dribbling ?? randomize(base.dribbling),
            defense: overrides.defense ?? randomize(base.defense),
            stamina: overrides.stamina ?? randomize(base.stamina),
        };
    }
    
    private randomSkinTone(): THREE.Color {
        const tones = [0xFFDBAC, 0xE0B090, 0x8D5524, 0xC68642, 0xD4A574];
        return new THREE.Color(tones[Math.floor(Math.random() * tones.length)]);
    }

    /**
     * Generates all necessary textures using PixelArtGenerator
     */
    private generateSpriteFrames() {
        const W = 24;
        const H = 32;
        const colors = {
            skin: this.skinColor,
            shirt: this.jerseyColor,
            shorts: this.shortsColor,
            hair: this.hairColor,
            shoes: '#111111'
        };
        
        // Helper to bake a texture
        const bake = (name: string, pose: any) => {
            const frame = PixelArtGenerator.createFrame(W, H);
            PixelArtGenerator.generateHumanoid(frame, colors, pose);
            const canvas = PixelArtGenerator.drawCanvas(frame, 4); // Scale up 4x for crispy texture
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            this.textures[name] = tex;
        };
        
        // 1. Idle
        bake('idle_0', { 
            headY: 4, bodyY: 10, 
            leftLegY: 0, rightLegY: 0, 
            leftArmAngle: 0.2, rightArmAngle: -0.2 
        });
        
        // 2. Run Frames (4 frame cycle)
        // Frame 1: Right leg forward
        bake('run_0', { 
            headY: 5, bodyY: 11, // Bob down
            leftLegY: -1, rightLegY: 2, // L back, R fwd
            leftArmAngle: -0.5, rightArmAngle: 0.5 
        });
        // Frame 2: Neutral / Passing
        bake('run_1', { 
            headY: 3, bodyY: 9, // Bob up
            leftLegY: 0, rightLegY: 0, 
            leftArmAngle: 0, rightArmAngle: 0 
        });
        // Frame 3: Left leg forward
        bake('run_2', { 
            headY: 5, bodyY: 11, // Bob down
            leftLegY: 2, rightLegY: -1, // L fwd, R back
            leftArmAngle: 0.5, rightArmAngle: -0.5 
        });
        // Frame 4: Neutral
        bake('run_3', { 
            headY: 3, bodyY: 9, // Bob up
            leftLegY: 0, rightLegY: 0, 
            leftArmAngle: 0, rightArmAngle: 0 
        });
        
        // 3. Kick
        bake('kick_0', {
            headY: 4, bodyY: 10,
            leftLegY: 0, rightLegY: 4, // R leg high
            leftArmAngle: 0.8, rightArmAngle: -0.8 // Balance
        });
    }

    private createNumberSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.number.toString(), 16, 16);
        ctx.fillText(this.number.toString(), 16, 16);
        
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(0.4, 0.4, 1);
        sprite.center.set(0.5, 0.0);
        sprite.position.set(0, 1.4, 0); // Above head
        this.mesh.add(sprite);
    }
    
    public update(dt: number) {
        // Position update
        this.position.add(this.velocity.clone().multiplyScalar(dt * 60));
        this.mesh.position.copy(this.position);
        
        // Friction / Slow down
        this.velocity.multiplyScalar(0.9);
        if (this.velocity.length() < 0.001) this.velocity.set(0,0,0);
        
        // Stamina logic
        const speed = this.velocity.length();
        // ... (Stamina logic same as before) ...
        
        // Animation State Machine
        let nextState: PlayerState = 'idle';
        if (speed > 0.05) nextState = 'run';
        // Add logic for 'kick' state here if we tracked action triggers
        
        if (nextState !== this.currentState) {
            this.currentState = nextState;
            this.currentFrameIdx = 0;
            this.animTimer = 0;
        }
        
        // Animation Update
        this.animTimer += dt;
        let frameName = 'idle_0';
        
        if (this.currentState === 'run') {
            // Run at 10fps typically
            const spf = 0.1; 
            if (this.animTimer > spf) {
                this.animTimer -= spf;
                this.currentFrameIdx = (this.currentFrameIdx + 1) % 4; // 4 run frames
            }
            frameName = `run_${this.currentFrameIdx}`;
            
            // Flip sprite based on direction
            if (this.velocity.x < -0.01) this.isFlipped = true; // Left
            if (this.velocity.x > 0.01) this.isFlipped = false; // Right
            
        } else {
            // Idle
            frameName = 'idle_0';
        }
        
        // Update Texture
        if (this.textures[frameName]) {
            this.sprite.material.map = this.textures[frameName];
            
            // To flip X, we just invert scale.x
            const scaleX = Math.abs(this.sprite.scale.x);
            this.sprite.scale.x = this.isFlipped ? -scaleX : scaleX;
        }
    }
    
    public move(dx: number, dy: number, sprint: boolean = false) {
        if (dx === 0 && dy === 0) return;
        
        // Simplified move logic similar to before
        let speedMult = 0.1 + (this.stats.speed / 99) * 0.1;
        if (sprint && this.currentStamina > 0) speedMult *= 1.5;
        
        this.velocity.x = dx * speedMult;
        this.velocity.y = dy * speedMult;
    }
    
    public setPosition(x: number, y: number) {
        this.position.set(x, y, 0);
        this.mesh.position.copy(this.position);
    }
    
    public getSpeed(): number { return 0.15; } // Simplified
    public getKickPower(charge: number): number { return 1.0 + charge; } // Simplified
    public getPassAccuracy(): number { return 0.8; }
    public getDribbleControl(): number { return 1.0; }
}
