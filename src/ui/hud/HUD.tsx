
import React from 'react';
import { UIState } from '../UIStore';
import { PlayPicker } from './PlayPicker';
import { KickMeter } from './KickMeter';

export const HUD: React.FC<{ state: UIState }> = ({ state }) => {
    const { scoreHome, scoreAway, down, distanceToFirst, playStateMessage, showPlayPicker,
            showKickMeter, kickPower, kickPhase, kickAccuracyPosition } = state;

    const ord = (n: number) => {
        if (n === 1) return 'st';
        if (n === 2) return 'nd';
        if (n === 3) return 'rd';
        return 'th';
    };

    return (
        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 20px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                color: 'white',
                fontFamily: '"VT323", monospace',
                fontSize: '2rem',
                textShadow: '2px 2px 0 #000'
            }}>
                <div style={{ color: '#aaaaff' }}>HOME: {scoreHome}</div>
                
                <div style={{ textAlign: 'center' }}>
                    <div>{down}{ord(down)} & {distanceToFirst.toFixed(0)}</div>
                    <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>Q1 15:00</div>
                </div>

                <div style={{ color: '#ffaaaa' }}>AWAY: {scoreAway}</div>
            </div>

            {/* Center Message */}
            {playStateMessage && !showKickMeter && (
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '1rem 2rem',
                    border: '2px solid white',
                    color: '#ffcc00',
                    fontSize: '2rem',
                    fontFamily: '"VT323", monospace',
                    textAlign: 'center'
                }}>
                    {playStateMessage}
                </div>
            )}

            {/* Play Picker */}
            <PlayPicker visible={showPlayPicker} />

            {/* Kick Meter */}
            <KickMeter 
                visible={showKickMeter}
                power={kickPower}
                phase={kickPhase}
                accuracyPosition={kickAccuracyPosition}
            />
        </div>
    );
};
