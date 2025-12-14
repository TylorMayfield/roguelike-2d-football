import * as THREE from 'three';
import { SceneManager } from '../rendering/SceneManager';
import { AssetLoader } from '../rendering/AssetLoader';
import { Player, PlayerGender, PlayerSize } from './Player';
import { PlayerSprite } from '../rendering/sprites/PlayerSprite';
import { Defender } from './Defender';
import { OffensiveFormations, DefensiveFormations } from './Formation';

/**
 * PlayerSpawner - Handles spawning of players and formations.
 */
export class PlayerSpawner {
    private static skinColors = [
        new THREE.Color(0xffccaa), // Light
        new THREE.Color(0xe0ac69), // Medium
        new THREE.Color(0x5c3a1e)  // Dark
    ];

    /**
     * Spawn the main controllable player.
     */
    public static spawnMainPlayer(
        gender: PlayerGender,
        size: PlayerSize,
        jerseyColor: THREE.Color,
        existingPlayer?: Player
    ): Player | null {
        const textures = AssetLoader.textures;
        
        if (existingPlayer) {
            SceneManager.remove(existingPlayer.mesh);
        }
        
        const walkKey = gender === PlayerGender.FEMALE ? 'universal_female_base' : 'universal_base';
        const actionKey = gender === PlayerGender.FEMALE ? 'universal_female_actions' : 'universal_actions';
        
        let skinColor = new THREE.Color(0xe0ac69);
        if (gender === PlayerGender.FEMALE) skinColor.setHex(0xffccaa);
        if (size === PlayerSize.LARGE) skinColor.setHex(0x5c3a1e);
        
        let pantsColor = new THREE.Color(0xcccccc);
        if (jerseyColor.getHex() === 0x00FF00) pantsColor.setHex(0xffffff);
        
        if (textures[walkKey]) {
            const jerseyNumber = 88;
            const idleTex = PlayerSprite.generateIdleSheet(gender, jerseyNumber);
            idleTex.magFilter = THREE.NearestFilter;

            const player = new Player(
                textures[walkKey],
                idleTex,
                gender,
                size,
                jerseyColor,
                skinColor,
                pantsColor,
                textures[actionKey]
            );
            // Set z slightly above 0 for layering
            player.mesh.position.z = 0.1;
            player.mesh.castShadow = true;
            SceneManager.add(player.mesh);
            return player;
        }
        return null;
    }

    /**
     * Spawn offensive formation players.
     */
    public static spawnOffensivePlayers(): Player[] {
        const textures = AssetLoader.textures;
        const oFormation = OffensiveFormations['Shotgun'];
        const players: Player[] = [];

        oFormation.forEach(spot => {
            if (spot.role === 'QB') return;
            
            const isFemale = Math.random() < 0.4;
            const gender = isFemale ? PlayerGender.FEMALE : PlayerGender.MALE;
            const size = Math.random() < 0.3 ? PlayerSize.LARGE : PlayerSize.MEDIUM;
            const skinColor = this.skinColors[Math.floor(Math.random() * this.skinColors.length)];
            
            const baseKey = isFemale ? 'universal_female_base' : 'universal_base';
            const actionKey = isFemale ? 'universal_female_actions' : 'universal_actions';

            if (textures[baseKey]) {
                const idleTex = PlayerSprite.generateIdleSheet(gender, 88);
                idleTex.magFilter = THREE.NearestFilter;

                const p = new Player(
                    textures[baseKey],
                    idleTex,
                    gender,
                    size,
                    new THREE.Color(0x00FF00),
                    skinColor,
                    new THREE.Color(0xffffff),
                    textures[actionKey]
                );
                p.mesh.position.z = 0.1;
                p.mesh.castShadow = true;
                players.push(p);
                SceneManager.add(p.mesh);
            }
        });

        return players;
    }

    /**
     * Spawn defensive formation players.
     */
    public static spawnDefensivePlayers(): Defender[] {
        const textures = AssetLoader.textures;
        const dFormation = DefensiveFormations['4-3'];
        const defenders: Defender[] = [];

        dFormation.forEach(() => {
            const d = new Defender(textures['universal_base'], textures['universal_actions']);
            d.material.uniforms.uJerseyColor.value.setHex(0xAA0000);
            d.material.uniforms.uPantsColor.value.setHex(0x333333);
            
            const defSkin = this.skinColors[Math.floor(Math.random() * this.skinColors.length)];
            d.material.uniforms.uSkinColor.value.copy(defSkin);

            d.mesh.position.z = 0.1;
            d.mesh.castShadow = true;
            defenders.push(d);
            SceneManager.add(d.mesh);
        });

        return defenders;
    }

    /**
     * Spawn a main defender (captain).
     */
    public static spawnMainDefender(): Defender {
        const textures = AssetLoader.textures;
        const defender = new Defender(
            textures['universal_base'],
            textures['universal_actions'] ?? textures['universal_base']
        );
        defender.mesh.position.z = 0.1;
        defender.mesh.castShadow = true;
        SceneManager.add(defender.mesh);
        return defender;
    }
}
