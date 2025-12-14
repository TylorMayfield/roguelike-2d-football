/**
 * TextureGenerator - Facade for all sprite generators.
 * 
 * This module re-exports the individual sprite generators for backward compatibility
 * while allowing detailed development in separate files.
 */

import { PlayerSprite } from './sprites/PlayerSprite';
import { BallSprite } from './sprites/BallSprite';
import { RefereeSprite } from './sprites/RefereeSprite';
import { KEY_COLORS } from './sprites/SpriteBase';

export class TextureGenerator {
    // Expose key colors for external use (e.g., shader setup)
    public static COLOR_JERSEY = KEY_COLORS.JERSEY;
    public static COLOR_SKIN = KEY_COLORS.SKIN;
    public static COLOR_PANTS = KEY_COLORS.PANTS;
    
    // Player Sprites
    public static generateBaseSheet(gender: 'male' | 'female') {
        return PlayerSprite.generateBaseSheet(gender);
    }
    
    public static generateActionSheet(gender: 'male' | 'female') {
        return PlayerSprite.generateActionSheet(gender);
    }
    
    // Ball Sprites
    public static generateBallSheet(type: 'spiral' | 'wobble' | 'kick') {
        return BallSprite.generateSheet(type);
    }
    
    // Referee Sprites
    public static generateRefereeSheet() {
        return RefereeSprite.generateSheet();
    }
}

// Direct exports for those who want to import individual generators
export { PlayerSprite, BallSprite, RefereeSprite, KEY_COLORS };
