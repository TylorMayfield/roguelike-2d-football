import * as THREE from 'three';
import { SceneManager } from '../rendering/SceneManager';

export enum SoccerPosition {
    GK = 'GK',
    CB = 'CB',
    LB = 'LB',
    RB = 'RB',
    CDM = 'CDM',
    CM = 'CM',
    CAM = 'CAM',
    LM = 'LM',
    RM = 'RM',
    LW = 'LW',
    RW = 'RW',
    ST = 'ST'
}

export type Gender = 'male' | 'female';
export type Team = 'home' | 'away';

export interface PlayerStats {
    speed: number;      // 1-99, affects movement speed
    shooting: number;   // 1-99, affects shot power/accuracy
    passing: number;    // 1-99, affects pass accuracy
    dribbling: number;  // 1-99, affects ball control
    defense: number;    // 1-99, affects tackle success
    stamina: number;    // 1-99, affects max stamina
}

/**
 * SoccerPlayer - A soccer player with stats, stamina, and soccer-specific visuals.
 */
export class SoccerPlayer {
    public mesh: THREE.Group;
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    
    // Identity
    public readonly team: Team;
    public readonly gender: Gender;
    public readonly soccerPosition: SoccerPosition;
    public readonly number: number;
    
    // Stats
    public stats: PlayerStats;
    
    // Stamina
    public currentStamina: number;
    public maxStamina: number;
    private staminaDrainRate: number = 0.5;
    private staminaRegenRate: number = 0.2;
    
    // Gameplay
    public hasBall: boolean = false;
    public isControlled: boolean = false;
    private isSprinting: boolean = false;
    
    // Visuals
    private bodyMesh!: THREE.Mesh;
    private headMesh!: THREE.Mesh;
    private hairMesh: THREE.Mesh | null = null;
    private leftLeg!: THREE.Mesh;
    private rightLeg!: THREE.Mesh;
    private leftArm!: THREE.Mesh;
    private rightArm!: THREE.Mesh;
    private jerseyColor: THREE.Color;
    private shortsColor: THREE.Color;
    private skinColor: THREE.Color;
    
    // Animation
    private animTime: number = 0;
    
    // Collision
    public readonly collisionRadius: number = 1.5; // Radius for player collision (in world units)
    
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
        
        // Default stats based on position
        this.stats = this.generateStats(soccerPosition, stats);
        this.maxStamina = 50 + this.stats.stamina * 0.5;
        this.currentStamina = this.maxStamina;
        
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        
        // Colors
        this.jerseyColor = jerseyColor || (team === 'home' ? new THREE.Color(0x0066CC) : new THREE.Color(0xCC0000));
        this.shortsColor = shortsColor || new THREE.Color(0xFFFFFF);
        this.skinColor = this.randomSkinTone();
        
        // Create mesh
        this.mesh = new THREE.Group();
        this.createVisuals();
        
        // Scale up for visibility
        this.mesh.scale.set(3, 3, 1);
    }
    
    private generateStats(pos: SoccerPosition, overrides: Partial<PlayerStats>): PlayerStats {
        // Base stats by position
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
        // Add some randomness (+/- 10)
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
    
    private createVisuals() {
        // Body dimensions based on gender
        const bodyWidth = this.gender === 'female' ? 0.9 : 1.0;
        const bodyHeight = this.gender === 'female' ? 1.4 : 1.5;
        const hipWidth = this.gender === 'female' ? 1.1 : 0.95;
        
        // Create body (jersey + shorts)
        const bodyGeo = new THREE.PlaneGeometry(bodyWidth, bodyHeight);
        const bodyCanvas = this.createBodyTexture(bodyWidth, bodyHeight, hipWidth);
        const bodyTex = new THREE.CanvasTexture(bodyCanvas);
        bodyTex.magFilter = THREE.NearestFilter;
        
        this.bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshBasicMaterial({ 
            map: bodyTex, 
            transparent: true,
            side: THREE.DoubleSide 
        }));
        this.mesh.add(this.bodyMesh);
        
        // Create legs (separate meshes for animation)
        this.createLegs();
        
        // Create arms (separate meshes for animation)
        this.createArms();
        
        // Head
        const headGeo = new THREE.CircleGeometry(0.25, 16);
        this.headMesh = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: this.skinColor }));
        this.headMesh.position.y = bodyHeight / 2 + 0.2;
        this.mesh.add(this.headMesh);
        
        // Hair for everyone
        this.createHair();
        
        // Number on back (small text)
        this.createNumberSprite();
    }
    
    private createLegs() {
        const legWidth = 0.15;
        const legHeight = 0.5;
        const legGeo = new THREE.PlaneGeometry(legWidth, legHeight);
        
        // Create leg texture (shorts + skin + cleats)
        const legCanvas = document.createElement('canvas');
        legCanvas.width = 16;
        legCanvas.height = 48;
        const ctx = legCanvas.getContext('2d')!;
        
        const shortsCss = `#${this.shortsColor.getHexString()}`;
        const skinCss = `#${this.skinColor.getHexString()}`;
        
        // Shorts portion (top)
        ctx.fillStyle = shortsCss;
        ctx.fillRect(0, 0, 16, 16);
        
        // Skin (middle)
        ctx.fillStyle = skinCss;
        ctx.fillRect(0, 16, 16, 24);
        
        // Cleats (bottom)
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 40, 16, 8);
        
        const legTex = new THREE.CanvasTexture(legCanvas);
        legTex.magFilter = THREE.NearestFilter;
        
        const legMat = new THREE.MeshBasicMaterial({
            map: legTex,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Left leg
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.15, -0.5, 0.01);
        this.mesh.add(this.leftLeg);
        
        // Right leg
        this.rightLeg = new THREE.Mesh(legGeo, legMat.clone());
        this.rightLeg.position.set(0.15, -0.5, 0.01);
        this.mesh.add(this.rightLeg);
    }
    
    private createArms() {
        const armWidth = 0.1;
        const armHeight = 0.35;
        const armGeo = new THREE.PlaneGeometry(armWidth, armHeight);
        const armMat = new THREE.MeshBasicMaterial({
            color: this.skinColor,
            side: THREE.DoubleSide
        });
        
        // Left arm
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.4, 0.15, 0.005);
        this.mesh.add(this.leftArm);
        
        // Right arm
        this.rightArm = new THREE.Mesh(armGeo, armMat.clone());
        this.rightArm.position.set(0.4, 0.15, 0.005);
        this.mesh.add(this.rightArm);
    }
    
    private createBodyTexture(width: number, height: number, hipWidth: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 96;
        const ctx = canvas.getContext('2d')!;
        
        const jerseyCss = `#${this.jerseyColor.getHexString()}`;
        const shortsCss = `#${this.shortsColor.getHexString()}`;
        const skinCss = `#${this.skinColor.getHexString()}`;
        
        // Clear
        ctx.clearRect(0, 0, 64, 96);
        
        // Shorts (bottom third)
        ctx.fillStyle = shortsCss;
        ctx.beginPath();
        if (this.gender === 'female') {
            // Wider hips
            ctx.moveTo(20, 55);
            ctx.lineTo(12, 80);
            ctx.lineTo(28, 80);
            ctx.lineTo(32, 55);
            ctx.moveTo(32, 55);
            ctx.lineTo(36, 80);
            ctx.lineTo(52, 80);
            ctx.lineTo(44, 55);
        } else {
            ctx.fillRect(16, 55, 32, 25);
        }
        ctx.fill();
        
        // Jersey (top two thirds)
        ctx.fillStyle = jerseyCss;
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(44, 10);
        ctx.lineTo(48, 20);
        ctx.lineTo(48, 55);
        ctx.lineTo(16, 55);
        ctx.lineTo(16, 20);
        ctx.closePath();
        ctx.fill();
        
        // Female chest definition (subtle shading on jersey)
        if (this.gender === 'female') {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            // Left chest shadow
            ctx.beginPath();
            ctx.ellipse(26, 28, 6, 5, 0.2, 0, Math.PI * 2);
            ctx.fill();
            // Right chest shadow
            ctx.beginPath();
            ctx.ellipse(38, 28, 6, 5, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // Highlights
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(24, 26, 4, 3, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(36, 26, 4, 3, -0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // V-neck
        ctx.fillStyle = skinCss;
        ctx.beginPath();
        ctx.moveTo(28, 10);
        ctx.lineTo(36, 10);
        ctx.lineTo(32, 20);
        ctx.closePath();
        ctx.fill();
        
        // Arms (skin)
        ctx.fillStyle = skinCss;
        ctx.fillRect(8, 15, 8, 20);
        ctx.fillRect(48, 15, 8, 20);
        
        // Legs (skin below shorts)
        ctx.fillRect(16, 80, 12, 16);
        ctx.fillRect(36, 80, 12, 16);
        
        // Cleats
        ctx.fillStyle = '#111111';
        ctx.fillRect(14, 92, 16, 4);
        ctx.fillRect(34, 92, 16, 4);
        
        return canvas;
    }
    
    private createHair() {
        const hairColors = [0x3B240B, 0x000000, 0x8B4513, 0xD4A574, 0xB7410E, 0x2C1810, 0x4A3728];
        const hairColor = new THREE.Color(hairColors[Math.floor(Math.random() * hairColors.length)]);
        const colorCss = `#${hairColor.getHexString()}`;
        
        const hairCanvas = document.createElement('canvas');
        hairCanvas.width = 48;
        hairCanvas.height = 64;
        const ctx = hairCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 48, 64);
        
        if (this.gender === 'female') {
            // Female: longer hair with ponytail
            const hairGeo = new THREE.PlaneGeometry(0.5, 0.7);
            
            // Hair on top of head
            ctx.fillStyle = colorCss;
            ctx.beginPath();
            ctx.ellipse(24, 16, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Ponytail flowing down
            const gradient = ctx.createLinearGradient(24, 20, 24, 60);
            gradient.addColorStop(0, colorCss);
            gradient.addColorStop(1, '#1a0a00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(16, 20);
            ctx.quadraticCurveTo(10, 40, 14, 58);
            ctx.lineTo(34, 58);
            ctx.quadraticCurveTo(38, 40, 32, 20);
            ctx.closePath();
            ctx.fill();
            
            // Hair tie
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.ellipse(24, 26, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const hairTex = new THREE.CanvasTexture(hairCanvas);
            this.hairMesh = new THREE.Mesh(hairGeo, new THREE.MeshBasicMaterial({ 
                map: hairTex, 
                transparent: true,
                side: THREE.DoubleSide 
            }));
            this.hairMesh.position.set(0, 0.95, -0.05);
        } else {
            // Male: short hair on top of head
            const hairGeo = new THREE.PlaneGeometry(0.35, 0.25);
            
            // Short cropped hair
            ctx.fillStyle = colorCss;
            ctx.beginPath();
            ctx.ellipse(24, 20, 14, 10, 0, Math.PI, Math.PI * 2); // Top half only
            ctx.fill();
            
            // Add some texture/spikes for short hair
            for (let i = 0; i < 5; i++) {
                const x = 14 + i * 5;
                ctx.beginPath();
                ctx.moveTo(x, 12);
                ctx.lineTo(x + 2, 6 + Math.random() * 4);
                ctx.lineTo(x + 4, 12);
                ctx.fill();
            }
            
            const hairTex = new THREE.CanvasTexture(hairCanvas);
            this.hairMesh = new THREE.Mesh(hairGeo, new THREE.MeshBasicMaterial({ 
                map: hairTex, 
                transparent: true,
                side: THREE.DoubleSide 
            }));
            this.hairMesh.position.set(0, 1.05, 0.01);
        }
        
        this.mesh.add(this.hairMesh!);
    }
    
    private createNumberSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number.toString(), 16, 16);
        
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(0.3, 0.3, 1);
        sprite.position.set(0, 0.2, -0.05);
        this.mesh.add(sprite);
    }
    
    /**
     * Update player each frame
     */
    public update(dt: number) {
        this.animTime += dt;
        
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(dt * 60));
        this.mesh.position.copy(this.position);
        
        // Stamina
        if (this.isSprinting && this.velocity.length() > 0.01) {
            this.currentStamina = Math.max(0, this.currentStamina - this.staminaDrainRate * dt * 60);
        } else {
            this.currentStamina = Math.min(this.maxStamina, this.currentStamina + this.staminaRegenRate * dt * 60);
        }
        
        const speed = this.velocity.length();
        
        // Running animation
        if (speed > 0.01) {
            // Animation speed based on movement speed
            const animSpeed = 12 + speed * 30;
            const legSwing = Math.sin(this.animTime * animSpeed) * 0.4;
            const armSwing = Math.sin(this.animTime * animSpeed) * 0.3;
            
            // Body bob
            const bob = Math.abs(Math.sin(this.animTime * animSpeed)) * 0.02;
            this.bodyMesh.position.y = bob;
            this.headMesh.position.y = (this.gender === 'female' ? 0.9 : 0.95) + bob;
            
            // Leg animation - swing forward/back by rotating
            this.leftLeg.rotation.z = legSwing;
            this.rightLeg.rotation.z = -legSwing;
            
            // Move legs up/down to simulate running motion
            this.leftLeg.position.y = -0.5 + Math.max(0, Math.sin(this.animTime * animSpeed)) * 0.08;
            this.rightLeg.position.y = -0.5 + Math.max(0, -Math.sin(this.animTime * animSpeed)) * 0.08;
            
            // Arm animation - opposite to legs
            this.leftArm.rotation.z = -armSwing;
            this.rightArm.rotation.z = armSwing;
            this.leftArm.position.y = 0.15 + Math.abs(Math.sin(this.animTime * animSpeed + Math.PI)) * 0.03;
            this.rightArm.position.y = 0.15 + Math.abs(Math.sin(this.animTime * animSpeed)) * 0.03;
            
            // Animate hair
            if (this.hairMesh) {
                this.hairMesh.position.x = -this.velocity.x * 0.3 + Math.sin(this.animTime * animSpeed * 0.5) * 0.02;
                this.hairMesh.rotation.z = -this.velocity.x * 0.4;
            }
        } else {
            // Idle - reset animation
            this.leftLeg.rotation.z = 0;
            this.rightLeg.rotation.z = 0;
            this.leftLeg.position.y = -0.5;
            this.rightLeg.position.y = -0.5;
            this.leftArm.rotation.z = 0;
            this.rightArm.rotation.z = 0;
            this.leftArm.position.y = 0.15;
            this.rightArm.position.y = 0.15;
            this.bodyMesh.position.y = 0;
        }
        
        // Slow down
        this.velocity.multiplyScalar(0.9);
        if (this.velocity.length() < 0.001) {
            this.velocity.set(0, 0, 0);
        }
    }
    
    /**
     * Move player in direction
     */
    public move(dx: number, dy: number, sprint: boolean = false) {
        if (dx === 0 && dy === 0) return;
        
        this.isSprinting = sprint && this.currentStamina > 0;
        
        // Speed based on stats and stamina
        let speedMult = 0.1 + (this.stats.speed / 99) * 0.1;
        if (this.isSprinting) speedMult *= 1.5;
        if (this.currentStamina < 20) speedMult *= 0.7; // Tired
        
        this.velocity.x = dx * speedMult;
        this.velocity.y = dy * speedMult;
    }
    
    /**
     * Set position directly
     */
    public setPosition(x: number, y: number) {
        this.position.set(x, y, 0);
        this.mesh.position.copy(this.position);
    }
    
    /**
     * Get speed based on stats
     */
    public getSpeed(): number {
        let base = 0.1 + (this.stats.speed / 99) * 0.1;
        if (this.currentStamina < 20) base *= 0.7;
        return base;
    }
    
    /**
     * Get kick power based on stats and stamina
     */
    public getKickPower(charge: number): number {
        const basePower = 1 + (this.stats.shooting / 99) * 2;
        const staminaMod = 0.5 + (this.currentStamina / this.maxStamina) * 0.5;
        return basePower * charge * staminaMod;
    }
    
    /**
     * Get pass accuracy based on stats
     */
    public getPassAccuracy(): number {
        return this.stats.passing / 99;
    }
    
    /**
     * Get dribble control (affects ball distance)
     */
    public getDribbleControl(): number {
        return 0.3 + (this.stats.dribbling / 99) * 0.4;
    }
}
