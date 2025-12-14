import React, { useEffect, useState } from 'react';
import { UIStore, UIState } from './UIStore';
import { MainMenu } from './menus/MainMenu';
import { SettingsMenu } from './menus/SettingsMenu';
import { HUD } from './hud/HUD';

export const App: React.FC = () => {
    const [uiState, setUiState] = useState<UIState>(UIStore.getState());

    useEffect(() => {
        return UIStore.subscribe(setUiState);
    }, []);

    return (
        <div className="ui-root" style={{ 
            width: '100%', 
            height: '100%', 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            pointerEvents: 'none' // Allow canvas clicks generally, enable pointer-events on buttons
        }}>
            {uiState.screen === 'menu' && <MainMenu />}
            {uiState.screen === 'settings' && <SettingsMenu />}
            {uiState.screen === 'hud' && <HUD state={uiState} />}
        </div>
    );
};
