/**
 * Main Entry Point - Roguelike 2D Football
 * 
 * This file orchestrates all game systems.
 * Individual responsibilities are delegated to:
 * - SceneManager: Three.js scene/camera/renderer
 * - AssetLoader: Texture loading
 * - TeamManager: Player/formation management
 * - GamePhysics: Movement/collisions/ball logic
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
import { FieldRenderer } from './FieldRenderer';

// Game
import { FootballRules, PlayState } from '../game/FootballRules';
import { TeamManager } from '../game/TeamManager';
import { TileMap } from '../game/TileMap';

// Physics
import { GamePhysics } from '../physics/GamePhysics';

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

// Field
const tileMap = new TileMap(120, 54, 1);
const fieldRenderer = new FieldRenderer(SceneManager.scene);
fieldRenderer.createField(tileMap);

// Stadium Background
const stadiumGeo = new THREE.PlaneGeometry(200, 100);
const stadiumMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
const stadiumMesh = new THREE.Mesh(stadiumGeo, stadiumMat);
stadiumMesh.position.z = -1;
SceneManager.add(stadiumMesh);

// Game Rules
const footballRules = new FootballRules();

// Input & Game Manager
const inputManager = new InputManager();
const gameManager = new GameManager(
    () => {
        console.log('Game Started!');
        footballRules.resetGame();
        TeamManager.resetPositions(footballRules);
    },
    inputManager
);

// HUDManager (Store) initialized via imports


// Load external assets then initialize teams
AssetLoader.loadExternalAssets().then(() => {
    // Initialize team entities
    TeamManager.init(footballRules);
    TeamManager.resetPositions(footballRules);
    
    // Spawn fans
    // const fanTexture = AssetLoader.textures['fan'];
    // if (fanTexture) {
    //     TeamManager.spawnFans(fanTexture);
    // }
});

// Initialize physics
GamePhysics.init(inputManager, gameManager, footballRules, tileMap);

// ============ MAIN LOOP ============

function animate() {
    requestAnimationFrame(animate);
    
    // Update game systems
    gameManager.update();
    GamePhysics.update();
    GamePhysics.updateFormations();
    HUDManager.update(footballRules);
    
    // Update Fans
    TeamManager.fans.forEach(f => f.update(16));
    
    // Update Referee
    if (TeamManager.referee) {
        TeamManager.referee.update(16);
    }
    
    // Camera follow
    if (TeamManager.player) {
        SceneManager.followTarget(TeamManager.player.position);
    }
    
    // Render
    SceneManager.render();
}

animate();

// ============ DB CHECK ============
window.electronAPI.queryDb('SELECT 1').then(() => {
    console.log('DB Connection Active');
}).catch(err => console.error('DB Error', err));
