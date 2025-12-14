import * as THREE from 'three';

// Positions relative to Line of Scrimmage (LOS is x=0)
// Positive Y = Field's Upper side, Negative Y = Field's Lower Side
// Positive X = Towards opponent's endzone (offense goes +X, defense starts +X)

export interface FormationSpot {
    role: string;
    x: number; // Relative to LOS
    y: number; // Relative to center of field (y=0)
}

// Basic Offensive Formations
export const OffensiveFormations: { [name: string]: FormationSpot[] } = {
    'Shotgun': [
        { role: 'Center', x: 0, y: 0 },
        { role: 'LGuard', x: 0, y: 2 },
        { role: 'RGuard', x: 0, y: -2 },
        { role: 'LTackle', x: 0, y: 4 },
        { role: 'RTackle', x: 0, y: -4 },
        { role: 'QB', x: -5, y: 0 },      // Player controlled
        // WRs (for future use)
        // { role: 'WR_L', x: 0, y: 15 },
        // { role: 'WR_R', x: 0, y: -15 },
    ],
    'IForm': [
        { role: 'Center', x: 0, y: 0 },
        { role: 'LGuard', x: 0, y: 2 },
        { role: 'RGuard', x: 0, y: -2 },
        { role: 'LTackle', x: 0, y: 4 },
        { role: 'RTackle', x: 0, y: -4 },
        { role: 'QB', x: -3, y: 0 },
        { role: 'FB', x: -5, y: 0 },
        { role: 'RB', x: -7, y: 0 },
    ]
};

// Basic Defensive Formations
export const DefensiveFormations: { [name: string]: FormationSpot[] } = {
    '4-3': [
        // D-Line
        { role: 'DT_L', x: 2, y: 1 },
        { role: 'DT_R', x: 2, y: -1 },
        { role: 'DE_L', x: 2, y: 5 },
        { role: 'DE_R', x: 2, y: -5 },
        // Linebackers
        { role: 'MLB', x: 5, y: 0 },
        { role: 'OLB_L', x: 5, y: 6 },
        { role: 'OLB_R', x: 5, y: -6 },
        // DBs (for future use)
        // { role: 'CB_L', x: 10, y: 15 },
        // { role: 'CB_R', x: 10, y: -15 },
        // { role: 'FS', x: 15, y: 3 },
        // { role: 'SS', x: 15, y: -3 },
    ]
};
