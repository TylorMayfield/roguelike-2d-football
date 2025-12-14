
import React from 'react';

export const PlayPicker: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null;

    const handlePlay = (playType: 'run' | 'pass') => {
        window.dispatchEvent(new CustomEvent('play:selected', { detail: { playType } }));
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '20px',
            border: '2px solid white',
            textAlign: 'center',
            pointerEvents: 'auto'
        }}>
            <h2 style={{ color: 'white', fontFamily: '"VT323", monospace', margin: '0 0 10px 0' }}>Choose Play</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handlePlay('run')} className="hud-btn">Run Play</button>
                <button onClick={() => handlePlay('pass')} className="hud-btn">Pass Play</button>
            </div>
             <style>{`
                .hud-btn {
                    padding: 10px 20px;
                    font-family: "VT323", monospace;
                    font-size: 1.2rem;
                    cursor: pointer;
                    background: #444;
                    color: white;
                    border: 1px solid #777;
                }
                .hud-btn:hover {
                    background: #666;
                    border-color: white;
                }
            `}</style>
        </div>
    );
};
