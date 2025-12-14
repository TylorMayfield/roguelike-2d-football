import React from 'react';

interface KickMeterProps {
    visible: boolean;
    power: number; // 0-1
    phase: 'power' | 'accuracy' | 'done';
    accuracyPosition: number; // 0-1, where 0.5 is perfect
}

export const KickMeter: React.FC<KickMeterProps> = ({ visible, power, phase, accuracyPosition }) => {
    if (!visible) return null;

    const powerWidth = power * 100;
    const accuracyLeft = accuracyPosition * 100;
    
    // Color based on accuracy (green in center, red at edges)
    const getAccuracyColor = () => {
        const distance = Math.abs(accuracyPosition - 0.5) * 2; // 0 = perfect, 1 = worst
        if (distance < 0.2) return '#00ff00';
        if (distance < 0.4) return '#88ff00';
        if (distance < 0.6) return '#ffff00';
        if (distance < 0.8) return '#ff8800';
        return '#ff0000';
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            pointerEvents: 'none'
        }}>
            {/* Title */}
            <div style={{
                textAlign: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontFamily: '"VT323", monospace',
                textShadow: '2px 2px 0 #000',
                marginBottom: '10px'
            }}>
                {phase === 'power' && 'HOLD SPACE FOR POWER'}
                {phase === 'accuracy' && 'RELEASE FOR ACCURACY'}
                {phase === 'done' && 'KICK!'}
            </div>

            {/* Power Bar Container */}
            <div style={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '3px solid white',
                borderRadius: '5px',
                height: '40px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Power Fill */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${powerWidth}%`,
                    background: 'linear-gradient(to right, #00aa00, #ffff00, #ff0000)',
                    transition: phase === 'power' ? 'none' : 'width 0.1s'
                }} />

                {/* Power Zones */}
                <div style={{
                    position: 'absolute',
                    left: '70%',
                    top: 0,
                    width: '2px',
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.5)'
                }} />
                <div style={{
                    position: 'absolute',
                    left: '90%',
                    top: 0,
                    width: '2px',
                    height: '100%',
                    backgroundColor: 'rgba(255,0,0,0.8)'
                }} />
            </div>

            {/* Accuracy Bar (only show after power is set) */}
            {(phase === 'accuracy' || phase === 'done') && (
                <div style={{
                    marginTop: '15px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '3px solid white',
                    borderRadius: '5px',
                    height: '30px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Center Target Zone */}
                    <div style={{
                        position: 'absolute',
                        left: '40%',
                        width: '20%',
                        height: '100%',
                        backgroundColor: 'rgba(0,255,0,0.3)',
                        borderLeft: '2px solid #00ff00',
                        borderRight: '2px solid #00ff00'
                    }} />

                    {/* Accuracy Marker */}
                    <div style={{
                        position: 'absolute',
                        left: `${accuracyLeft}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '8px',
                        height: '25px',
                        backgroundColor: phase === 'done' ? getAccuracyColor() : 'white',
                        borderRadius: '3px',
                        boxShadow: '0 0 10px white'
                    }} />
                </div>
            )}
        </div>
    );
};
