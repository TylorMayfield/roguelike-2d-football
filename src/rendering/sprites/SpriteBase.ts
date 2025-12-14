import * as THREE from 'three';

/**
 * Shared utilities and constants for all sprite generators.
 */

// Key Colors for Shader Replacement
export const KEY_COLORS = {
    JERSEY: '#00FF00', // Green
    SKIN: '#FF00FF',   // Magenta
    PANTS: '#0000FF'   // Blue
};

/**
 * Creates a canvas with 2D context configured for pixel art.
 */
export function createSpriteCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
}

/**
 * Converts a canvas to a THREE.CanvasTexture with pixel-art settings.
 */
export function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}
