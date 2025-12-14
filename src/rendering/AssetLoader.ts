import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';
import footballUrl from '../assets/football.png';
import stadiumUrl from '../assets/stadium.png';
import fanUrl from '../assets/fan.png';

/**
 * AssetLoader - Handles loading and generating all game textures.
 */
class AssetLoaderClass {
    public textures: { [key: string]: THREE.Texture } = {};
    public proceduralTextures: { [key: string]: THREE.Texture } = {};
    
    private textureLoader = new THREE.TextureLoader();

    /**
     * Load all external texture assets.
     */
    public loadExternalAssets(): Promise<void> {
        return new Promise((resolve) => {
            // Load football
            this.textures['football'] = this.textureLoader.load(footballUrl);
            
            // Load stadium
            const stadiumTexture = this.textureLoader.load(stadiumUrl);
            stadiumTexture.wrapS = THREE.RepeatWrapping;
            stadiumTexture.wrapT = THREE.RepeatWrapping;
            stadiumTexture.repeat.set(20, 10);
            this.textures['stadium'] = stadiumTexture;
            
            // Load fan
            this.textureLoader.load(fanUrl, (fanTexture) => {
                fanTexture.magFilter = THREE.NearestFilter;
                fanTexture.minFilter = THREE.NearestFilter;
                this.textures['fan'] = fanTexture;
                resolve();
            });
        });
    }

    /**
     * Generate all procedural textures (players, ball, referee).
     */
    public generateProceduralAssets() {
        // Male Player
        this.textures['universal_base'] = TextureGenerator.generateBaseSheet('male');
        this.textures['universal_actions'] = TextureGenerator.generateActionSheet('male');
        
        // Female Player
        this.textures['universal_female_base'] = TextureGenerator.generateBaseSheet('female');
        this.textures['universal_female_actions'] = TextureGenerator.generateActionSheet('female');
        
        // Ball animations
        this.proceduralTextures['ball_spiral'] = TextureGenerator.generateBallSheet('spiral');
        this.proceduralTextures['ball_wobble'] = TextureGenerator.generateBallSheet('wobble');
        this.proceduralTextures['ball_kick'] = TextureGenerator.generateBallSheet('kick');
        
        // Referee
        this.proceduralTextures['referee'] = TextureGenerator.generateRefereeSheet();
    }

    /**
     * Get a texture by key (checks both external and procedural).
     */
    public getTexture(key: string): THREE.Texture | undefined {
        return this.textures[key] || this.proceduralTextures[key];
    }
}

// Singleton export
export const AssetLoader = new AssetLoaderClass();
