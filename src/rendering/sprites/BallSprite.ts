import * as THREE from 'three';
import { createSpriteCanvas, canvasToTexture } from './SpriteBase';

/**
 * Procedural generation for Football sprites.
 */
export class BallSprite {
    private static readonly TILE_SIZE = 16;
    private static readonly BROWN = '#8B4513';
    private static readonly WHITE = '#FFFFFF';

    /**
     * Generates a 4x1 animation strip for the ball.
     * Types: spiral, wobble, kick (end-over-end)
     */
    public static generateSheet(type: 'spiral' | 'wobble' | 'kick'): THREE.CanvasTexture {
        const cols = 4;
        const rows = 1;
        const { canvas, ctx } = createSpriteCanvas(this.TILE_SIZE * cols, this.TILE_SIZE * rows);

        for (let col = 0; col < cols; col++) {
            this.drawFrame(ctx, col, type);
        }

        return canvasToTexture(canvas);
    }

    private static drawFrame(ctx: CanvasRenderingContext2D, col: number, type: 'spiral' | 'wobble' | 'kick') {
        const x = col * this.TILE_SIZE;
        const cx = x + this.TILE_SIZE / 2;
        const cy = this.TILE_SIZE / 2;

        ctx.save();
        ctx.translate(cx, cy);

        if (type === 'kick') {
            this.drawKickFrame(ctx, col);
        } else {
            this.drawSpiralOrWobble(ctx, col, type);
        }

        ctx.restore();
    }

    private static drawKickFrame(ctx: CanvasRenderingContext2D, col: number) {
        // End-over-end tumble (width changes based on rotation)
        let scaleX = 1;
        if (col === 1 || col === 3) scaleX = 0.7;
        if (col === 2) scaleX = 0.4;
        
        ctx.fillStyle = this.BROWN;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6 * scaleX, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Laces (only on side views)
        if (col === 0 || col === 3) {
            ctx.fillStyle = this.WHITE;
            ctx.fillRect(-2 * scaleX, -1, 4 * scaleX, 2);
        }
    }

    private static drawSpiralOrWobble(ctx: CanvasRenderingContext2D, col: number, type: 'spiral' | 'wobble') {
        // Wobble adds rotation
        if (type === 'wobble') {
            const angle = Math.sin(col * Math.PI) * 0.3;
            ctx.rotate(angle);
        }

        // Ball body
        ctx.fillStyle = this.BROWN;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Laces (spinning position)
        const laceY = (col % 4) - 1.5;
        if (col !== 3) { // Hidden on back
            ctx.fillStyle = this.WHITE;
            ctx.fillRect(-3, laceY, 6, 1);
        }
    }
}
