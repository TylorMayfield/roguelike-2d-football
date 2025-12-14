
import React, { useState } from 'react';

export const SettingsMenu: React.FC = () => {
    // Local state for settings, real implementation would sync with SettingsManager
    const [res, setRes] = useState('1280x720');
    const [aa, setAa] = useState(false);
    const [vol, setVol] = useState(1.0);

    const handleSave = () => {
        // Dispatch save event with data
        window.dispatchEvent(new CustomEvent('settings:save', { 
            detail: { resolution: res, antialias: aa, volume: vol } 
        }));
        window.dispatchEvent(new CustomEvent('ui:settings:close'));
    };

    return (
        <div className="menu-overlay" style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'auto',
            zIndex: 101
        }}>
             <div className="menu-container settings-container" style={{
                color: 'white',
                fontFamily: '"VT323", monospace',
                background: '#222',
                padding: '2rem',
                border: '4px solid #444',
                minWidth: '400px'
             }}>
                <h2 style={{ textAlign: 'center', color: '#ffcc00', fontSize: '2.5rem' }}>Settings</h2>
                
                <div style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Resolution:</label>
                  <select 
                    value={res} 
                    onChange={e => setRes(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit', fontSize: '1.2rem' }}
                  >
                    <option value="1280x720">1280x720</option>
                    <option value="1920x1080">1920x1080</option>
                  </select>
                </div>

                <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center' }}>
                  <label style={{ flex: 1 }}>Antialiasing:</label>
                  <input 
                    type="checkbox" 
                    checked={aa} 
                    onChange={e => setAa(e.target.checked)}
                    style={{ transform: 'scale(1.5)' }} 
                  />
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Volume: {Math.round(vol * 100)}%</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={vol} 
                    onChange={e => setVol(parseFloat(e.target.value))}
                    style={{ width: '100%' }} 
                  />
                </div>

                <button onClick={handleSave} style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '10px',
                    fontSize: '1.5rem',
                    fontFamily: 'inherit',
                    background: '#ffcc00',
                    color: 'black',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}>Save & Back</button>
             </div>
        </div>
    );
};
