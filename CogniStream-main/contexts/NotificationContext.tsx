
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface NotificationContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false,
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, visible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={hideToast}
            />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
