import * as THREE from 'three';
import { KEY_COLORS, createSpriteCanvas, canvasToTexture } from './SpriteBase';

/**
 * Procedural generation for Player sprites (walk cycle, actions).
 * Supports male/female body types with distinct morphology.
 */
export class PlayerSprite {
    private static readonly TILE_SIZE = 64; // Increased resolution
    
    // Default jersey number (can be overridden)
    private static defaultNumber = 88;

    /**
     * Generates a 4x4 walk cycle sprite sheet with fluid animation.
     * Rows: Down, Up, Left, Right
     * Cols: Animation frames (0, 1, 2, 3) - smooth walk cycle
     */
    public static generateBaseSheet(gender: 'male' | 'female', jerseyNumber?: number): THREE.CanvasTexture {
        const cols = 4;
        const rows = 4;
        const { canvas, ctx } = createSpriteCanvas(this.TILE_SIZE * cols, this.TILE_SIZE * rows);
        const number = jerseyNumber ?? this.defaultNumber;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.drawWalkFrame(ctx, col, row, gender, number);
            }
        }
        
        return canvasToTexture(canvas);
    }

    /**
     * Generates a 4x4 idle sprite sheet.
     * Rows: Down, Up, Left, Right
     * Cols: Animation frames (Breathing, subtle movements)
     */
    public static generateIdleSheet(gender: 'male' | 'female', jerseyNumber?: number): THREE.CanvasTexture {
        const cols = 4;
        const rows = 4;
        const { canvas, ctx } = createSpriteCanvas(this.TILE_SIZE * cols, this.TILE_SIZE * rows);
        const number = jerseyNumber ?? this.defaultNumber;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.drawIdleFrame(ctx, col, row, gender, number);
            }
        }
        
        return canvasToTexture(canvas);
    }
    
    /**
     * Generates a 4x4 action sprite sheet.
     * Row 0: Throw
     * Row 1: Kick
     * Row 2: Tackle
     * Row 3: Block
     */
    public static generateActionSheet(gender: 'male' | 'female', jerseyNumber?: number): THREE.CanvasTexture {
        const cols = 4;
        const rows = 4;
        const { canvas, ctx } = createSpriteCanvas(this.TILE_SIZE * cols, this.TILE_SIZE * rows);
        const number = jerseyNumber ?? this.defaultNumber;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let action = '';
                if (row === 0) action = 'throw';
                else if (row === 1) action = 'kick';
                else if (row === 2) action = 'tackle';
                else if (row === 3) action = 'block';
                
                this.drawActionFrame(ctx, col, row, gender, action as any, number);
            }
        }
        
        return canvasToTexture(canvas);
    }

    // ... (walk frame drawing omitted for brevity, assuming standard rc helper exists) ...

    // ========== ACTION FRAME DRAWING ==========
    
    private static drawActionFrame(ctx: CanvasRenderingContext2D, col: number, row: number, gender: 'male' | 'female', action: 'throw' | 'kick' | 'tackle' | 'block', jerseyNumber: number) {
        const x = col * this.TILE_SIZE;
        const y = row * this.TILE_SIZE;
        const s = 2;
        
        ctx.save();
        ctx.translate(x, y);
        
        if (action === 'throw') {
             this.drawThrowPose(ctx, col, gender, jerseyNumber, s);
        } else if (action === 'kick') {
             this.drawKickPose(ctx, col, gender, jerseyNumber, s);
        } else if (action === 'tackle') {
             this.drawTacklePose(ctx, col, gender, jerseyNumber, s);
        } else if (action === 'block') {
             this.drawBlockPose(ctx, col, gender, jerseyNumber, s);
        }

        ctx.restore();
    }
    
    // ... (Component drawing omitted) ...
    
    // ========== ACTION POSES ==========
    
    // ... (Throw and Kick pose logic exists, adding new ones) ...
    
    private static drawTacklePose(ctx: CanvasRenderingContext2D, col: number, gender: 'male' | 'female', jerseyNumber: number, s: number) {
        // Horizontal diving pose
        // Frame 0: Prepare, Frame 1-2: Mid-air/Contact, Frame 3: Land
        
        const diveOffset = [0, 4, 6, 2][col]; // Forward movement visual
        const heightOffset = [0, -4, -2, 0][col]; 
        
        // Rotate canvas for diving effect? Or just draw rotated rects?
        // Let's rotate context slightly
        ctx.save();
        ctx.translate(16 * s, 16 * s);
        ctx.rotate(-Math.PI / 4); // 45 degree dive
        ctx.translate(-16 * s, -16 * s);
        
        const dx = diveOffset;
        const dy = heightOffset;
        
        // Helmet
        this.drawHelmet(ctx, dy, 3, s); // Side view
        
        // Torso
        this.drawTorso(ctx, dy, gender, jerseyNumber, 3, s); 
        
        // Arms (Reaching out)
        ctx.fillStyle = KEY_COLORS.JERSEY;
        this.rc(ctx, 22, 10 + dy, 8, 4, s); // Reaching forward
        ctx.fillStyle = KEY_COLORS.SKIN;
        this.rc(ctx, 30, 10 + dy, 3, 3, s); // Hands
        
        // Legs (Trailing)
        ctx.fillStyle = KEY_COLORS.PANTS;
        this.rc(ctx, 6, 22 + dy, 8, 5, s);
        this.rc(ctx, 6, 27 + dy, 8, 5, s);
        
        ctx.restore();
    }
    
    private static drawBlockPose(ctx: CanvasRenderingContext2D, col: number, gender: 'male' | 'female', jerseyNumber: number, s: number) {
        // Wide stance, arms up
        // Frame 0-3: Slight bracing vibration/breathing
        
        const bob = (col % 2 === 0) ? -1 : 0;
        
        // Helmet
        this.drawHelmet(ctx, bob, 0, s); // Front view
        
        // Torso
        this.drawTorso(ctx, bob, gender, jerseyNumber, 0, s);
        
        // Arms (Up and Out - blocking)
        ctx.fillStyle = KEY_COLORS.JERSEY;
        // Left arm out
        this.rc(ctx, 2, 12 + bob, 6, 4, s); // Upper
        this.rc(ctx, 0, 8 + bob, 4, 6, s);  // Forearm up
        // Right arm out
        this.rc(ctx, 24, 12 + bob, 6, 4, s);
        this.rc(ctx, 28, 8 + bob, 4, 6, s);
        
        // Hands (Open palms)
        ctx.fillStyle = KEY_COLORS.SKIN;
        this.rc(ctx, 0, 4 + bob, 4, 4, s);
        this.rc(ctx, 28, 4 + bob, 4, 4, s);
        
        // Legs (Wide Stance)
        ctx.fillStyle = KEY_COLORS.PANTS;
        this.rc(ctx, 6, 22 + bob, 6, 10, s);  // Left (wider than normal)
        this.rc(ctx, 20, 22 + bob, 6, 10, s); // Right (wider than normal)
        
        // Cleats
        ctx.fillStyle = '#222222';
        this.rc(ctx, 6, 30 + bob, 6, 2, s);
        this.rc(ctx, 20, 30 + bob, 6, 2, s);
    }

    // ========== IDLE FRAME DRAWING ==========

    private static drawIdleFrame(ctx: CanvasRenderingContext2D, col: number, row: number, gender: 'male' | 'female', jerseyNumber: number) {
        const x = col * this.TILE_SIZE;
        const y = row * this.TILE_SIZE;
        const s = 2; // Scale factor
        
        ctx.save();
        ctx.translate(x, y);

        // Breathing animation (subtle vertical bob)
        // Cycle: 0 -> 1 -> 0 -> -1
        const breathCycle = [0, 1, 0, -1]; 
        const bob = breathCycle[col] * 0.5;

        // Arm slight movement
        const armWave = Math.sin(col * Math.PI / 2) * 1; 

        // Components
        // Order: Standard based on facing
        
        if (row === 1) { // UP (Back view)
            this.drawArms(ctx, bob, armWave, -armWave, row, s); 
            this.drawLegs(ctx, 0, row, 0, 0, s); // No leg movement
            this.drawTorso(ctx, bob, gender, jerseyNumber, row, s);
            this.drawHelmet(ctx, bob + (breathCycle[col] * 0.5), row, s); // Head bobs slightly more? or independently?
        } else {
            // Down/Right/Left
            this.drawLegs(ctx, 0, row, 0, 0, s);
            this.drawTorso(ctx, bob, gender, jerseyNumber, row, s);
            this.drawHelmet(ctx, bob, row, s);
            this.drawArms(ctx, bob, armWave, -armWave, row, s);
        }

        ctx.restore();
    }

    // ========== WALK FRAME DRAWING ==========
    
    private static drawWalkFrame(ctx: CanvasRenderingContext2D, col: number, row: number, gender: 'male' | 'female', jerseyNumber: number) {
        const x = col * this.TILE_SIZE;
        const y = row * this.TILE_SIZE;
        const s = 2; // Scale factor (32 -> 64)
        
        ctx.save();
        ctx.translate(x, y);

        // Smoother walk cycle animation
        // Frame 0: Neutral, Frame 1: Right step, Frame 2: Neutral, Frame 3: Left step
        const walkPhase = col; // 0, 1, 2, 3
        
        // Body bob (slight vertical movement)
        const bob = (walkPhase === 1 || walkPhase === 3) ? -2 : 0;
        
        // Arm swing offsets
        const leftArmSwing = [0, -4, 0, 4][walkPhase];
        const rightArmSwing = [0, 4, 0, -4][walkPhase];
        
        // Leg offsets
        const leftLegOffset = [0, -6, 0, 6][walkPhase];
        const rightLegOffset = [0, 6, 0, -6][walkPhase];
        
        // --- Draw Components ---
        // Order: Legs -> Arms (Back) -> Torso -> Head -> Arms (Front)
        // Actually for standard 2D top-down/RPG style:
        
        if (row === 1) { // UP (Back view)
             this.drawArms(ctx, bob, leftArmSwing, rightArmSwing, row, s); // Behind torso? No, arms usually on side.
             this.drawLegs(ctx, bob, row, leftLegOffset, rightLegOffset, s);
             this.drawTorso(ctx, bob, gender, jerseyNumber, row, s);
             this.drawHelmet(ctx, bob, row, s);
        } else {
             // Down/Right/Left
             this.drawLegs(ctx, bob, row, leftLegOffset, rightLegOffset, s);
             this.drawTorso(ctx, bob, gender, jerseyNumber, row, s);
             this.drawHelmet(ctx, bob, row, s);
             this.drawArms(ctx, bob, leftArmSwing, rightArmSwing, row, s);
        }

        ctx.restore();
    }
    

    
    // ========== COMPONENT DRAWING ==========
    
    // Helper for rects
    private static rc(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
        ctx.fillRect(x * s, y * s, w * s, h * s);
    }
    
    private static drawHelmet(ctx: CanvasRenderingContext2D, bob: number, row: number, s: number) {
        const offY = bob / s;
        
        // Helmet shell - Rounder shape
        ctx.fillStyle = KEY_COLORS.PANTS;
        
        // Main dome
        this.rc(ctx, 9, 1 + offY, 14, 11, s);
        // Rounding corners
        this.rc(ctx, 10, 0 + offY, 12, 1, s); // Top
        this.rc(ctx, 8, 2 + offY, 1, 9, s);   // Left
        this.rc(ctx, 23, 2 + offY, 1, 9, s);  // Right
        
        // Facemask (dark grey cage)
        if (row !== 1) { // Not visible from back
            ctx.fillStyle = '#444444';
            this.rc(ctx, 10, 7 + offY, 12, 4, s); // Mask area
            
            // Face opening (skin visible)
            if (row === 0) { // Front
                ctx.fillStyle = KEY_COLORS.SKIN;
                this.rc(ctx, 12, 4 + offY, 8, 4, s);
                // Eyes?
                ctx.fillStyle = '#111';
                this.rc(ctx, 13, 5 + offY, 2, 1, s);
                this.rc(ctx, 17, 5 + offY, 2, 1, s);
            } else { // Side
                ctx.fillStyle = KEY_COLORS.SKIN;
                // Side profile face
                 if (row === 3) this.rc(ctx, 18, 4 + offY, 4, 4, s); // Facing Right
                 if (row === 2) this.rc(ctx, 10, 4 + offY, 4, 4, s); // Facing Left
            }
        }
        
        // Helmet stripe
        ctx.fillStyle = '#FFFFFF';
        this.rc(ctx, 15, 0 + offY, 2, 12, s);
    }
    
    private static drawTorso(ctx: CanvasRenderingContext2D, bob: number, gender: 'male' | 'female', jerseyNumber: number, row: number, s: number) {
        ctx.fillStyle = KEY_COLORS.JERSEY;
        const torsoY = 12 + (bob / s);
        
        if (gender === 'male') {
            // == MALE ==
            // Broad shoulders
            this.rc(ctx, 4, torsoY, 24, 4, s); 
            // V-taper Body
            this.rc(ctx, 6, torsoY + 4, 20, 4, s);
            this.rc(ctx, 8, torsoY + 8, 16, 4, s);
        } else {
            // == FEMALE ==
            // Shoulders (less broad than male)
            this.rc(ctx, 6, torsoY, 20, 3, s);
            
            // Chest (Upper Torso) - Full width
            this.rc(ctx, 8, torsoY + 3, 16, 3, s);
            
            // Bust Definition (Lighter highlights)
            if (row === 0 || row === 2 || row === 3) {
                ctx.fillStyle = 'rgba(255,255,255,0.2)'; // Highlight
                if (row === 0) {
                   this.rc(ctx, 9, torsoY + 3, 6, 2, s);
                   this.rc(ctx, 17, torsoY + 3, 6, 2, s);
                } else if (row === 3) { // Right
                   this.rc(ctx, 16, torsoY + 3, 4, 2, s);
                } else if (row === 2) { // Left
                   this.rc(ctx, 12, torsoY + 3, 4, 2, s);
                }
                ctx.fillStyle = KEY_COLORS.JERSEY; // Reset
            }

            // Waist (Narrow) -> Hourglass
            this.rc(ctx, 10, torsoY + 6, 12, 3, s);
            
            // Hips (Wide)
            this.rc(ctx, 7, torsoY + 9, 18, 3, s);
        }
        
        // Jersey number (Front and Back)
        if (row === 0 || row === 1) {
            this.drawJerseyNumber(ctx, torsoY + 4, jerseyNumber, gender, s);
        }
    }
    
    private static drawJerseyNumber(ctx: CanvasRenderingContext2D, y: number, number: number, gender: 'male' | 'female', s: number) {
        ctx.fillStyle = '#FFFFFF';
        const numStr = String(number).padStart(2, '0').slice(-2);
        const centerX = 16;
        
        this.drawDigit(ctx, centerX - 4, y, parseInt(numStr[0]), s);
        this.drawDigit(ctx, centerX + 1, y, parseInt(numStr[1]), s);
    }
    
    private static drawDigit(ctx: CanvasRenderingContext2D, x: number, y: number, digit: number, s: number) {
        // Simple 3x5 pixel font
        const patterns: { [key: number]: number[][] } = {
            0: [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
            1: [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
            2: [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
            3: [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
            4: [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
            5: [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
            6: [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
            7: [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
            8: [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
            9: [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
        };
        
        const pattern = patterns[digit] || patterns[0];
        for (let py = 0; py < 5; py++) {
            for (let px = 0; px < 3; px++) {
                if (pattern[py][px]) {
                    this.rc(ctx, x + px, y + py, 1, 1, s);
                }
            }
        }
    }
    
    private static drawArms(ctx: CanvasRenderingContext2D, bob: number, leftSwing: number, rightSwing: number, row: number, s: number) {
        const armY = 14 + (bob/s);
        const lSwing = leftSwing / s;
        const rSwing = rightSwing / s;
        
        // For side views (row 2, 3), only show one arm
        if (row === 2) { // Facing Left - show right arm
            ctx.fillStyle = KEY_COLORS.JERSEY;
            this.rc(ctx, 12 + rSwing, armY, 4, 7, s);
            ctx.fillStyle = KEY_COLORS.SKIN;
            this.rc(ctx, 12 + rSwing, armY + 7, 4, 3, s); // Hand
        } else if (row === 3) { // Facing Right - show left arm
            ctx.fillStyle = KEY_COLORS.JERSEY;
            this.rc(ctx, 16 + lSwing, armY, 4, 7, s);
            ctx.fillStyle = KEY_COLORS.SKIN;
            this.rc(ctx, 16 + lSwing, armY + 7, 4, 3, s); // Hand
        } else { // Front/Back views
            ctx.fillStyle = KEY_COLORS.JERSEY;
            this.rc(ctx, 4 + lSwing, armY, 4, 7, s);  // Left
            this.rc(ctx, 24 + rSwing, armY, 4, 7, s); // Right
            
            // Hands
            ctx.fillStyle = KEY_COLORS.SKIN;
            this.rc(ctx, 4 + lSwing, armY + 7, 4, 3, s);
            this.rc(ctx, 24 + rSwing, armY + 7, 4, 3, s);
        }
    }
    
    private static drawLegs(ctx: CanvasRenderingContext2D, bob: number, row: number, leftOffset: number, rightOffset: number, s: number) {
        ctx.fillStyle = KEY_COLORS.PANTS;
        const legY = 22 + (bob/s);
        const legH = 10;
        const lOff = leftOffset / s;
        const rOff = rightOffset / s;
        
        if (row === 2 || row === 3) { // Side views
            // Single combined leg visual with stride motion
            const strideOffset = (lOff + rOff) / 2; // Rough approx
            this.rc(ctx, 12 + strideOffset, legY, 8, legH, s);
            
            // Cleat
            ctx.fillStyle = '#222222';
            this.rc(ctx, 12 + strideOffset, legY + legH - 2, 8, 2, s);
        } else { // Front/Back views
            // Left leg
            this.rc(ctx, 9, legY + Math.abs(lOff), 5, legH - Math.abs(lOff), s);
            // Right leg
            this.rc(ctx, 18, legY + Math.abs(rOff), 5, legH - Math.abs(rOff), s);
            
            // Cleats
            ctx.fillStyle = '#222222';
            this.rc(ctx, 9, legY + legH - 2, 5, 2, s);
            this.rc(ctx, 18, legY + legH - 2, 5, 2, s);
        }
    }
    
    // ========== ACTION POSES ==========
    
    private static drawThrowPose(ctx: CanvasRenderingContext2D, col: number, gender: 'male' | 'female', jerseyNumber: number, s: number) {
        const armAngles = [-4, 0, 5, 8]; 
        const armYOff = -armAngles[col];
        
        // Helmet
        this.drawHelmet(ctx, 0, 3, s); // Use side profile helmet

        // Torso
        this.drawTorso(ctx, 0, gender, jerseyNumber, 3, s); // Side view

        // Throwing Arm (Right arm)
        const armX = 22;
        const armY = 12 + armYOff;
        
        ctx.fillStyle = KEY_COLORS.JERSEY;
        this.rc(ctx, armX, armY, 6, 5, s);
        
        // Hand
        ctx.fillStyle = KEY_COLORS.SKIN;
        this.rc(ctx, armX + 4, armY, 3, 3, s);
        
        // Ball
        if (col <= 1) {
            ctx.fillStyle = "#8B4513";
            this.rc(ctx, armX + 6, armY - 2, 5, 7, s); // Larger ball
            ctx.fillStyle = "#FFFFFF";
            this.rc(ctx, armX + 7, armY, 3, 1, s);
        }
        
        // Legs (Planted)
        ctx.fillStyle = KEY_COLORS.PANTS;
        this.rc(ctx, 10, 22, 6, 10, s);
        this.rc(ctx, 18, 22, 6, 10, s);
        ctx.fillStyle = '#222222';
        this.rc(ctx, 10, 30, 6, 2, s);
        this.rc(ctx, 18, 30, 6, 2, s);
    }
    
    private static drawKickPose(ctx: CanvasRenderingContext2D, col: number, gender: 'male' | 'female', jerseyNumber: number, s: number) {
         // Helmet
         this.drawHelmet(ctx, 0, 3, s);
         // Torso
         this.drawTorso(ctx, 0, gender, jerseyNumber, 3, s);

         ctx.fillStyle = KEY_COLORS.PANTS;
         
         // Kicking leg progression
         const kickOffsets = [
             { x: 14, y: 22, h: 10 },
             { x: 16, y: 20, h: 11 },
             { x: 22, y: 16, h: 12 },
             { x: 28, y: 18, h: 10 }
         ];
         
         const kick = kickOffsets[col];
         this.rc(ctx, kick.x, kick.y, 6, kick.h, s);
         
         // Planted leg
         this.rc(ctx, 10, 22, 6, 10, s);
         
         // Cleats
         ctx.fillStyle = '#222222';
         this.rc(ctx, 10, 30, 6, 2, s);
         this.rc(ctx, kick.x, kick.y + kick.h - 2, 6, 2, s);
    }
}
