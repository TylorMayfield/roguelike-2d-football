
import React from 'react';
import { GameManager } from '../../core/GameManager';

// We need a way to trigger GameManager actions. 
// For now, we can perhaps expose a global or inject it?
// Or better: GameManager subscribes to UI Events?
// Let's assume we can dispatch events or call global GameManager for now, 
// but cleaner is to have a bridge.
// Given strict TS, let's use a CustomEvent or window global if GameManager is singleton.
// Taking a peek at GameManager.ts, it's not a singleton export, it's instantiated in renderer.ts.
// We should probably export the instance from renderer.ts or make it singleton.
// For expediency, we will dispatch CustomEvents that renderer/GameManager listens to.

export const MainMenu: React.FC = () => {
    const handleStart = () => {
        window.dispatchEvent(new CustomEvent('game:start'));
    };

    const handleSettings = () => {
        window.dispatchEvent(new CustomEvent('ui:settings:open'));
    };

    const handleExit = () => {
        window.close();
    };

    return (
        <div className="menu-overlay" style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'auto',
            zIndex: 100
        }}>
            <div className="menu-container" style={{
                textAlign: 'center',
                color: 'white',
                fontFamily: '"VT323", monospace'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '2rem', color: '#ffcc00', textShadow: '4px 4px #000' }}>
                    Roguelike 2D Football
                </h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', margin: '0 auto' }}>
                    <button onClick={handleStart} className="retro-btn">New Game</button>
                    <button onClick={handleSettings} className="retro-btn">Settings</button>
                    <button onClick={handleExit} className="retro-btn">Exit</button>
                </div>
            </div>
            <style>{`
                .retro-btn {
                    padding: 15px;
                    font-family: "VT323", monospace;
                    font-size: 1.5rem;
                    background: #333;
                    color: white;
                    border: 2px solid #555;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .retro-btn:hover {
                    background: #444;
                    border-color: #ffcc00;
                    color: #ffcc00;
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};
