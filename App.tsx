
import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { AppState, BrandingSettings, Client } from './types';
import { INITIAL_APP_STATE } from './constants';
import ClientView from './components/client/ClientView';
import AdminView from './components/admin/AdminView';
import AuthPage from './components/auth/AuthPage';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

type AppContextType = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentUser: Client | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (newUser: Omit<Client, 'id'>) => void;
  resetPassword: (email: string) => string;
};

// This interface is needed because it's not a standard part of the TS DOM library yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '99 102 241'; // Default to indigo
};

const ViewToggleButton: React.FC<{ isAdminView: boolean; setIsAdminView: (isAdmin: boolean) => void }> = ({ isAdminView, setIsAdminView }) => (
  <div className="fixed bottom-4 right-4 z-50">
    <button
      onClick={() => setIsAdminView(!isAdminView)}
      className="bg-secondary text-white px-4 py-2 rounded-full shadow-lg hover:bg-secondary-dark transition-transform hover:scale-105"
    >
      {isAdminView ? 'Ver como Cliente' : 'Painel Admin'}
    </button>
  </div>
);

const MaintenanceMode: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-screen bg-gray-100 text-center">
        <div className="p-10 bg-white rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-primary mb-4">Em Manutenção</h1>
            <p className="text-gray-600">{message}</p>
        </div>
    </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    let finalState: AppState;
    try {
      const savedState = localStorage.getItem('agendaLinkState');
      finalState = savedState ? JSON.parse(savedState) : INITIAL_APP_STATE;
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      finalState = INITIAL_APP_STATE;
    }

    // BUG FIX: Ensure default admin user is always up-to-date from constants,
    // preventing login issues caused by stale data in localStorage.
    const defaultAdmin = INITIAL_APP_STATE.clients.find(c => c.role === 'admin');
    if (defaultAdmin) {
      const adminIndex = finalState.clients.findIndex(c => c.email.toLowerCase() === defaultAdmin.email.toLowerCase());

      if (adminIndex !== -1) {
        // Admin exists, ensure critical details like password and role are correct.
        finalState.clients[adminIndex] = {
          ...finalState.clients[adminIndex],
          password: defaultAdmin.password,
          role: 'admin'
        };
      } else {
        // Admin doesn't exist, add them.
        finalState.clients.push(defaultAdmin);
      }
    }

    return finalState;
  });

  const [currentUser, setCurrentUser] = useState<Client | null>(() => {
    try {
        const savedUser = localStorage.getItem('agendaLinkCurrentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        return null;
    }
  });
  
  const [isAdminView, setIsAdminView] = useState(currentUser?.role === 'admin');
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  useEffect(() => {
    localStorage.setItem('agendaLinkState', JSON.stringify(state));
    applyBranding(state.settings.branding);
  }, [state]);

  useEffect(() => {
    if (currentUser) {
        localStorage.setItem('agendaLinkCurrentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('agendaLinkCurrentUser');
    }
  }, [currentUser]);

  const handleInstallClick = () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setInstallPromptEvent(null);
    });
  };
  
  const applyBranding = (branding: BrandingSettings) => {
    document.title = branding.appName;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgb(branding.colors.primary));
    root.style.setProperty('--color-secondary', hexToRgb(branding.colors.secondary));
    root.style.setProperty('--color-accent', hexToRgb(branding.colors.accent));
  };
  
  const login = useCallback((email: string, password: string) => {
    const user = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
    if (user) {
        setCurrentUser(user);
        setIsAdminView(user.role === 'admin');
    } else {
        throw new Error('Email ou senha inválidos.');
    }
  }, [state.clients]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const register = useCallback((newUserData: Omit<Client, 'id'>) => {
    const emailExists = state.clients.some(c => c.email.toLowerCase() === newUserData.email.toLowerCase());
    if (emailExists) {
        throw new Error('Este e-mail já está em uso.');
    }
    const newUser: Client = {
        id: new Date().toISOString(),
        ...newUserData
    };
    setState(prev => ({ ...prev, clients: [...prev.clients, newUser] }));
    setCurrentUser(newUser);
    setIsAdminView(false);
  }, [state.clients]);

  const resetPassword = useCallback((email: string) => {
      const userIndex = state.clients.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
      if (userIndex === -1) {
          throw new Error('E-mail não encontrado.');
      }
      const newPassword = Math.random().toString(36).slice(-8);
      setState(prev => {
          const newClients = [...prev.clients];
          newClients[userIndex] = { ...newClients[userIndex], password: newPassword };
          return { ...prev, clients: newClients };
      });
      return newPassword;
  }, [state.clients]);


  const contextValue = useMemo(() => ({ state, setState, currentUser, login, logout, register, resetPassword }), [state, currentUser, login, logout, register, resetPassword]);

  if (!currentUser) {
      return (
        <AppContext.Provider value={contextValue}>
            <AuthPage />
        </AppContext.Provider>
      );
  }

  if (state.settings.maintenanceMode.enabled && currentUser.role !== 'admin') {
      return <MaintenanceMode message={state.settings.maintenanceMode.message} />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
        {isAdminView ? <AdminView /> : <ClientView />}
        {currentUser.role === 'admin' && <ViewToggleButton isAdminView={isAdminView} setIsAdminView={setIsAdminView} />}
        {installPromptEvent && !isAdminView && <PWAInstallPrompt onInstall={handleInstallClick} />}
      </div>
    </AppContext.Provider>
  );
}
