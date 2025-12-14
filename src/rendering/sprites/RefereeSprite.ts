import * as THREE from 'three';
import { createSpriteCanvas, canvasToTexture } from './SpriteBase';

/**
 * Procedural generation for Referee sprites.
 */
export class RefereeSprite {
    private static readonly TILE_SIZE = 32;

    /**
     * Generates a 4x4 walk cycle sprite sheet for referees.
     */
    public static generateSheet(): THREE.CanvasTexture {
        const cols = 4;
        const rows = 4;
        const { canvas, ctx } = createSpriteCanvas(this.TILE_SIZE * cols, this.TILE_SIZE * rows);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
               this.drawFrame(ctx, col, row);
            }
        }
        
        return canvasToTexture(canvas);
    }

    private static drawFrame(ctx: CanvasRenderingContext2D, col: number, row: number) {
        const x = col * this.TILE_SIZE;
        const y = row * this.TILE_SIZE;
        
        ctx.save();
        ctx.translate(x, y);

        let bob = 0;
        if (col === 1 || col === 3) bob = -1;

        // Head & Cap
        this.drawHead(ctx, bob);
        
        // Striped Jersey
        this.drawJersey(ctx, bob);
        
        // Legs
        this.drawLegs(ctx, bob, row, col);

        ctx.restore();
    }
    
    private static drawHead(ctx: CanvasRenderingContext2D, bob: number) {
        // Skin
        ctx.fillStyle = '#ffccaa';
        ctx.fillRect(10, 2 + bob, 12, 10);
        
        // White Cap
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 2 + bob, 12, 3);
        
        // Black Peak
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 4 + bob, 12, 1);
    }
    
    private static drawJersey(ctx: CanvasRenderingContext2D, bob: number) {
        const jerseyTop = 12 + bob;
        
        // White Base
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, jerseyTop, 20, 10);
        
        // Black Vertical Stripes
        ctx.fillStyle = '#000000';
        for(let i = 6; i < 26; i += 4) {
            ctx.fillRect(i, jerseyTop, 2, 10);
        }
    }
    
    private static drawLegs(ctx: CanvasRenderingContext2D, bob: number, row: number, col: number) {
        ctx.fillStyle = '#000000'; // Black pants
        const legY = 22 + bob;
        const legH = 8;

        if (row === 2 || row === 3) { // Side views
            const shift = (col % 2 === 0) ? 0 : (col === 1 ? -3 : 3);
            ctx.fillRect(12 + shift, legY, 6, legH);
        } else { // Front/Back
            ctx.fillRect(10, legY, 4, legH);
            ctx.fillRect(18, legY, 4, legH);
        }
    }
}
