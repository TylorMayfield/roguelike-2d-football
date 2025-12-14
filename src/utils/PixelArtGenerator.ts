export interface PixelArtFrame {
    width: number;
    height: number;
    pixels: (string | null)[][]; // Hex color or null for transparent
}

/**
 * Procedural Pixel Art Generator
 * Creates low-res canvases with cell-shaded outlines to simulate pixel art.
 */
export class PixelArtGenerator {
    
    /**
     * Draw a frame to a canvas
     */
    public static drawCanvas(frame: PixelArtFrame, scale: number = 1): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = frame.width * scale;
        canvas.height = frame.height * scale;
        const ctx = canvas.getContext('2d')!;
        
        // Disable smoothing for crisp pixels
        ctx.imageSmoothingEnabled = false;
        
        // 1. Draw colors
        for (let y = 0; y < frame.height; y++) {
            for (let x = 0; x < frame.width; x++) {
                const color = frame.pixels[y][x];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        
        // 2. Draw outlines (Check neighbors)
        // We do this by scanning the grid. If a pixel is transparent but has a solid neighbor, it's an outline.
        // Or simpler: Draw the sprite 4 times offset by 1 pixel in black behind the main sprite?
        // Let's do the "transparent neighbor" check for "inner" outlines too?
        // Actually, strictly "outline" usually means "border around color". 
        
        // Let's implement a second pass for outlines to keep it simple and authentic
        const outlineColor = '#000000';
        ctx.fillStyle = outlineColor;
        
        // Helper to check if a pixel is solid
        const isSolid = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) return false;
            return frame.pixels[y][x] !== null;
        };
        
        for (let y = 0; y < frame.height; y++) {
            for (let x = 0; x < frame.width; x++) {
                // If this is a transparent pixel...
                if (!isSolid(x, y)) {
                    // ...check if it borders a solid pixel
                    if (isSolid(x+1, y) || isSolid(x-1, y) || isSolid(x, y+1) || isSolid(x, y-1)) {
                        // Draw outline here
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
                // Also can add "inner" outlines (e.g. skin vs shirt) but that's complex without metadata.
                // We'll stick to exterior outlines for "cell shaded" look.
            }
        }
        
        return canvas;
    }
    
    /**
     * Create an empty frame
     */
    public static createFrame(width: number, height: number): PixelArtFrame {
        const pixels: (string | null)[][] = [];
        for (let y = 0; y < height; y++) {
            const row = new Array(width).fill(null);
            pixels.push(row);
        }
        return { width, height, pixels };
    }
    
    /**
     * Draw a rectangle to the frame
     */
    public static drawRect(frame: PixelArtFrame, x: number, y: number, w: number, h: number, color: string) {
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.floor(x + w);
        const endY = Math.floor(y + h);
        
        for (let iy = startY; iy < endY; iy++) {
            for (let ix = startX; ix < endX; ix++) {
                if (iy >= 0 && iy < frame.height && ix >= 0 && ix < frame.width) {
                    if (frame.pixels[iy]) {
                        frame.pixels[iy][ix] = color;
                    }
                }
            }
        }
    }
    
    /**
     * Generates a simple humanoid sprite frame
     */
    public static generateHumanoid(
        frame: PixelArtFrame,
        colors: { skin: string, shirt: string, shorts: string, hair: string, shoes: string },
        pose: { 
            headY: number, 
            bodyY: number, 
            leftLegY: number, rightLegY: number, 
            leftArmAngle: number, rightArmAngle: number 
        }
    ) {
        const cx = Math.floor(frame.width / 2);
        
        // 1. Head (inc hair)
        const headY = pose.headY;
        // Face
        this.drawRect(frame, cx - 3, headY, 6, 5, colors.skin);
        // Hair (top + back)
        this.drawRect(frame, cx - 3, headY - 2, 6, 2, colors.hair);
        this.drawRect(frame, cx - 4, headY - 1, 1, 4, colors.hair); // Sideburns
        this.drawRect(frame, cx + 3, headY - 1, 1, 4, colors.hair);
        
        // 2. Body (Shirt)
        const bodyY = pose.bodyY;
        this.drawRect(frame, cx - 3, bodyY, 6, 6, colors.shirt);
        // Sleeves
        this.drawRect(frame, cx - 5, bodyY, 2, 3, colors.shirt); // Shoulders
        this.drawRect(frame, cx + 3, bodyY, 2, 3, colors.shirt);
        
        // 3. Shorts
        const shortsY = bodyY + 6;
        this.drawRect(frame, cx - 3, shortsY, 6, 3, colors.shorts);
        
        // 4. Legs (Skin + Shoes)
        const legY = shortsY + 3;
        
        // Left Leg
        const ly = legY + pose.leftLegY;
        this.drawRect(frame, cx - 3, ly, 2, 3, colors.skin);
        this.drawRect(frame, cx - 3, ly + 3, 2, 2, colors.shoes); // Shoe
        
        // Right Leg
        const ry = legY + pose.rightLegY;
        this.drawRect(frame, cx + 1, ry, 2, 3, colors.skin);
        this.drawRect(frame, cx + 1, ry + 3, 2, 2, colors.shoes); // Shoe
        
        // 5. Arms (Skin) - Simplified as 2px wide blocks hanging down or angled
        // Simple vertical offset for "angle" for now
        const armY = bodyY + 1;
        
        // Left Arm
        const lay = armY + Math.sin(pose.leftArmAngle) * 2;
        this.drawRect(frame, cx - 5, lay + 3, 2, 3, colors.skin); // Hand/Forearm
        
        // Right Arm
        const ray = armY + Math.sin(pose.rightArmAngle) * 2;
        this.drawRect(frame, cx + 3, ray + 3, 2, 3, colors.skin);
    }
}
