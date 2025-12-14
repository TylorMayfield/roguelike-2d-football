import * as THREE from 'three';
import { TileMap, TileType } from '../game/TileMap';

describe('TileMap', () => {
    let tileMap: TileMap;

    beforeEach(() => {
        // Standard football field: 120 yards x 54 yards
        tileMap = new TileMap(120, 54, 1);
    });

    describe('Initialization', () => {
        it('should create a tile map with correct dimensions', () => {
            expect(tileMap.width).toBe(120);
            expect(tileMap.height).toBe(54);
        });

        it('should generate field tiles', () => {
            // Center of field should be grass
            const centerTile = tileMap.getTileAt(new THREE.Vector3(0, 0, 0));
            expect(centerTile).toBeDefined();
        });
    });

    describe('Endzone Detection', () => {
        it('should detect endzone tile in right endzone (x >= 50)', () => {
            const position = new THREE.Vector3(51, 0, 0);
            expect(tileMap.isTouchdown(position)).toBe(true);
        });

        it('should detect endzone tile in left endzone (x <= -50)', () => {
            const position = new THREE.Vector3(-51, 0, 0);
            expect(tileMap.isTouchdown(position)).toBe(true);
        });

        it('should not detect touchdown in middle of field', () => {
            const position = new THREE.Vector3(0, 0, 0);
            expect(tileMap.isTouchdown(position)).toBe(false);
        });

        it('should not detect touchdown just before endzone', () => {
            const position = new THREE.Vector3(49, 0, 0);
            expect(tileMap.isTouchdown(position)).toBe(false);
        });
    });

    describe('Tile Types', () => {
        it('should have line marker at center field (50-yard line)', () => {
            // Center (x=0) is the 50-yard line, which has a marker
            const tile = tileMap.getTileAt(new THREE.Vector3(0, 0, 0));
            expect(tile).toBe(TileType.LINE);
        });

        it('should have line markers at 5-yard intervals', () => {
            // At x = -45 (5-yard line from endzone)
            const tile = tileMap.getTileAt(new THREE.Vector3(-45, 0, 0));
            expect(tile).toBe(TileType.LINE);
        });

        it('should have endzone at far ends', () => {
            const leftEndzone = tileMap.getTileAt(new THREE.Vector3(-55, 0, 0));
            const rightEndzone = tileMap.getTileAt(new THREE.Vector3(55, 0, 0));
            
            expect(leftEndzone).toBe(TileType.ENDZONE);
            expect(rightEndzone).toBe(TileType.ENDZONE);
        });
    });

    describe('Bounds Handling', () => {
        it('should return GRASS for out of bounds positions', () => {
            const outOfBounds = tileMap.getTileAt(new THREE.Vector3(100, 100, 0));
            expect(outOfBounds).toBe(TileType.GRASS);
        });
    });
});
