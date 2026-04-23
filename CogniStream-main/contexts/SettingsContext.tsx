
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface SettingsContextType {
    settings: SystemSettings;
    updateSettings: (newSettings: Partial<SystemSettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
    themeColor: 'blue',
    uiDensity: 'comfortable',
    animationsEnabled: true,
    particleOpacity: 0.3,
    globalModel: 'gemini-2.5-flash-native-audio-preview-12-2025',
    temperature: 0.7,
    voiceTone: 'professional',
    aiMaxTokens: 2048,
    geminiApiKey: '',
    aiSystemContext: 'Você é um instrutor de inglês corporativo focado em tecnologia e finanças. Use um tom profissional e encorajador.',
    enabledModules: {
        analyze: true,
        enterprise: true,
        sjl: true,
        translator: true,
        liveAssistant: true,
        history: true,
    },
    sjl: {
        instructorName: 'Fernanda',
        welcomeMessage: 'Olá! Sou Fernanda, sua instrutora virtual. Vamos começar seu treinamento?',
        repetitionCount: 3,
        correctionCriteria: 'standard'
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(() => {
        try {
            const saved = localStorage.getItem('cognistream_system_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Deep merge para garantir que campos novos de DEFAULT_SETTINGS existam
                return {
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                    enabledModules: { ...DEFAULT_SETTINGS.enabledModules, ...(parsed.enabledModules || {}) },
                    sjl: { ...DEFAULT_SETTINGS.sjl, ...(parsed.sjl || {}) }
                };
            }
        } catch (e) {
            console.warn("[Settings] localStorage corrompido, usando defaults:", e);
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'config', 'system_settings'), 
            (snap) => {
                if (snap.exists()) {
                    const cloudSettings = snap.data() as SystemSettings;
                    setSettings(prev => {
                        const merged = {
                            ...prev,
                            ...cloudSettings,
                            enabledModules: { ...prev.enabledModules, ...(cloudSettings.enabledModules || {}) },
                            sjl: { ...prev.sjl, ...(cloudSettings.sjl || {}) }
                        };
                        localStorage.setItem('cognistream_system_settings', JSON.stringify(merged));
                        return merged;
                    });
                }
            },
            (error) => {
                console.warn("[Settings] Could not sync settings from cloud (permission denied or offline):", error.message);
            }
        );
        return () => unsub();
    }, []);

    useEffect(() => {
        localStorage.setItem('cognistream_system_settings', JSON.stringify(settings));

        // Apply theme variables globally
        const root = document.documentElement;
        const colors: any = {
            blue: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
            emerald: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
            purple: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
            orange: { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
            indigo: { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' },
            rose: { primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
            amber: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' }
        };

        const activeColor = colors[settings.themeColor] || colors.blue;
        root.style.setProperty('--primary-color', activeColor.primary);
        root.style.setProperty('--primary-glow', activeColor.glow);

        if (settings.animationsEnabled) {
            root.classList.remove('no-animations');
        } else {
            root.classList.add('no-animations');
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<SystemSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
