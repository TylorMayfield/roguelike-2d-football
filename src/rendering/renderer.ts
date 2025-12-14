/**
 * Main Entry Point - Roguelike 2D Soccer
 * 
 * This file orchestrates all game systems.
 * Individual responsibilities are delegated to:
 * - SceneManager: Three.js scene/camera/renderer
 * - AssetLoader: Texture loading
 * - TeamManager: Player/formation management
 * - SoccerPhysics: Movement/collisions/ball logic
 * - HUDManager: UI updates
 */

import '../index.css';
import * as THREE from 'three';

// Core Systems
import { GameManager, GameState } from '../core/GameManager';
import { InputManager } from '../core/InputManager';

// Managers
import { SceneManager } from './SceneManager';
import { AssetLoader } from './AssetLoader';
import { HUDManager } from './HUDManager';

// Game
import { SoccerRules, PlayState } from '../game/SoccerRules';
import { TeamManager } from '../game/TeamManager';
import { TileMap } from '../game/TileMap';

// Physics
import { SoccerPhysics } from '../physics/SoccerPhysics';

// React UI
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../ui/App';

// ============ INITIALIZATION ============

// Mount React UI
const rootEl = document.getElementById('root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(React.createElement(App));
}

// Generate procedural assets
AssetLoader.generateProceduralAssets();

// Create soccer rules
const soccerRules = new SoccerRules();

// Input & Game Manager
const inputManager = new InputManager();
const gameManager = new GameManager(
    () => {
        console.log('Game Started!');
        soccerRules.resetMatch();
    },
    inputManager
);

// TileMap (for collision if needed)
const tileMap = new TileMap(120, 80, 1);

// Load external assets then initialize teams
AssetLoader.loadExternalAssets().then(() => {
    // Initialize team entities (will need to update for soccer formations)
    // TeamManager.init(soccerRules as any);
    console.log('Assets loaded, soccer ready!');
});

// Initialize soccer physics (creates field and ball)
SoccerPhysics.init(inputManager, gameManager);

// ============ MAIN LOOP ============

function animate() {
    requestAnimationFrame(animate);
    
    // Update game systems
    gameManager.update();
    SoccerPhysics.update();
    
    // Update HUD with soccer-specific info
    // HUDManager.updateSoccer(soccerRules);
    
    // Camera follow controlled player
    const cameraTarget = SoccerPhysics.getCameraTarget();
    if (cameraTarget) {
        SceneManager.followTarget(cameraTarget);
    }
    
    // Render
    SceneManager.render();
}

animate();

// ============ DB CHECK ============
window.electronAPI.queryDb('SELECT 1').then(() => {
    console.log('DB Connection Active');
}).catch(err => console.error('DB Error', err));
