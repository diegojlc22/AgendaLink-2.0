import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { AppState, BrandingSettings, Client } from './types';
import { INITIAL_APP_STATE } from './constants';
import ClientView from './components/client/ClientView';
import AdminView from './components/admin/AdminView';
import Login from './components/auth/Login';

type AppContextType = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentUser: Client | null;
  login: (email: string, password: string) => void;
  logout: () => void;
};

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
    try {
      const savedState = localStorage.getItem('agendaLinkState');
      return savedState ? JSON.parse(savedState) : INITIAL_APP_STATE;
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      return INITIAL_APP_STATE;
    }
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
  
  const applyBranding = (branding: BrandingSettings) => {
    document.title = branding.appName;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgb(branding.colors.primary));
    root.style.setProperty('--color-secondary', hexToRgb(branding.colors.secondary));
    root.style.setProperty('--color-accent', hexToRgb(branding.colors.accent));
  };
  
  const login = (email: string, password: string) => {
    const user = state.clients.find(c => c.email === email && c.password === password);
    if (user) {
        setCurrentUser(user);
        setIsAdminView(user.role === 'admin');
    } else {
        throw new Error('Email ou senha inválidos.');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const contextValue = useMemo(() => ({ state, setState, currentUser, login, logout }), [state, currentUser]);

  if (!currentUser) {
      return (
        <AppContext.Provider value={contextValue}>
            <Login />
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
      </div>
    </AppContext.Provider>
  );
}