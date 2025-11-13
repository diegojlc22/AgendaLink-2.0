

import React, { useState, createContext, useContext, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { AppState, BrandingSettings, Client } from './types';
import { INITIAL_APP_STATE } from './constants';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { AlertTriangleIcon, WifiOffIcon, ShieldCheckIcon, UsersIcon } from './components/common/Icons';
import { initDatabase, loadStateFromDB, saveStateToDB } from './services/database';

const ClientView = lazy(() => import('./components/client/ClientView'));
const AdminView = lazy(() => import('./components/admin/AdminView'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));


type AppContextType = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentUser: Omit<Client, 'password'> | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (newUser: Omit<Client, 'id'>) => void;
  resetPassword: (email: string) => string;
  isAdminView: boolean;
  setIsAdminView: (isAdmin: boolean) => void;
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

const channel = new BroadcastChannel('agenda-link-state-sync');

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

const MaintenanceMode: React.FC = () => {
    const { state, login } = useAppContext();
    const { branding, maintenanceMode } = state.settings;

    const [clickCount, setClickCount] = useState(0);
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 5 clicks on the logo/text area will reveal the login form.
    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) {
            setShowAdminLogin(true);
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // IMPORTANT: We must also check that the user logging in has the 'admin' role.
            const user = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
            if (user?.role !== 'admin') {
                throw new Error('Acesso negado. Apenas administradores podem entrar durante a manutenção.');
            }
            login(email, password); // This will update currentUser and re-render App
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 text-center p-4 dark:bg-gray-900">
            <div className="p-8 sm:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div onClick={handleSecretClick} className="cursor-pointer">
                    {branding.logoEnabled && branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                    ) : (
                        <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <h1 className="text-3xl font-bold text-primary mb-2">Em Manutenção</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{maintenanceMode.message}</p>
                </div>

                {showAdminLogin && (
                    <form className="space-y-4 text-left border-t border-gray-200 dark:border-gray-700 pt-6" onSubmit={handleAdminLogin}>
                        <h2 className="text-xl font-bold text-center text-secondary mb-4">Login de Administrador</h2>
                        {error && (
                            <p className="p-2 text-sm text-center text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-lg">
                                {error}
                            </p>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                required
                                placeholder="admin@admin"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                required
                                placeholder="********"
                            />
                        </div>
                        <button type="submit" className="w-full px-4 py-2 font-bold text-white rounded-lg btn-secondary">
                            Acessar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const SyncStatusIndicator: React.FC = () => (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center p-2 z-[100] flex items-center justify-center text-sm shadow-lg">
        <WifiOffIcon className="h-5 w-5 mr-2" />
        Você está offline. Suas alterações estão sendo salvas localmente.
    </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  </div>
);


export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(true); // Novo estado de carregamento
  
  const [currentUser, setCurrentUser] = useState<Omit<Client, 'password'> | null>(() => {
    try {
        const savedUser = localStorage.getItem('agendaLinkCurrentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          // Security: Ensure password is not part of the session state
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        return null;
    } catch (error) {
        return null;
    }
  });
  
  const [isAdminView, setIsAdminView] = useState(currentUser?.role === 'admin');
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Efeito para inicializar o DB e carregar o estado
  useEffect(() => {
    const initializeApp = async () => {
      await initDatabase();
      let finalState = loadStateFromDB();

      if (!finalState) {
        finalState = INITIAL_APP_STATE;
      }
      
      // BUG FIX: Mantém o admin atualizado
      const defaultAdmin = INITIAL_APP_STATE.clients.find(c => c.role === 'admin');
      if (defaultAdmin) {
        const adminIndex = finalState.clients.findIndex(c => c.email.toLowerCase() === defaultAdmin.email.toLowerCase());
        if (adminIndex !== -1) {
          finalState.clients[adminIndex] = {
            ...finalState.clients[adminIndex],
            password: defaultAdmin.password,
            role: 'admin'
          };
        } else {
          finalState.clients.push(defaultAdmin);
        }
      }
      
      setState(finalState);
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Effect for online/offline status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Effect for multi-tab state sync via BroadcastChannel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'STATE_UPDATED') {
            const receivedState = data.payload;
            setState(currentState => {
                if (JSON.stringify(currentState) !== JSON.stringify(receivedState)) {
                    return receivedState;
                }
                return currentState;
            });
        } else if (data.type === 'CONFIG_UPDATED') {
            // This is a critical update, prompt user to reload to get all new assets and manifest
            if (window.confirm('As configurações da aplicação foram atualizadas pelo administrador. Deseja recarregar a página para ver as mudanças?')) {
                window.location.reload();
            }
        }
    };
    channel.addEventListener('message', handleMessage);

    return () => {
        channel.removeEventListener('message', handleMessage);
    };
  }, []);

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
  
  const applyBranding = useCallback((branding: BrandingSettings) => {
    document.title = branding.appName;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgb(branding.colors.primary));
    root.style.setProperty('--color-secondary', hexToRgb(branding.colors.secondary));
    root.style.setProperty('--color-accent', hexToRgb(branding.colors.accent));
    
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', branding.colors.primary);
    }
  }, []);

  // Effect to dynamically update the PWA manifest
  useEffect(() => {
    const updateManifestAndIcons = (branding: BrandingSettings) => {
      // Clean up old tags to prevent duplicates
      document.querySelector('link[rel="manifest"]')?.remove();
      document.querySelector('link[rel="apple-touch-icon"]')?.remove();
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.remove();

      if (!branding.appName || !branding.logoUrl) return;

      const manifest = {
        short_name: branding.appName.substring(0, 12),
        name: branding.appName,
        description: "An all-in-one web application for beauty professionals, featuring an advanced admin panel and intelligent client scheduling.",
        lang: "pt-BR",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: branding.colors.primary,
        background_color: "#f3f4f6",
        icons: [
          { src: branding.logoUrl, type: "image/png", sizes: "72x72" },
          { src: branding.logoUrl, type: "image/png", sizes: "96x96" },
          { src: branding.logoUrl, type: "image/png", sizes: "128x128" },
          { src: branding.logoUrl, type: "image/png", sizes: "144x144" },
          { src: branding.logoUrl, type: "image/png", sizes: "152x152" },
          { src: branding.logoUrl, type: "image/png", sizes: "192x192", purpose: "any maskable" },
          { src: branding.logoUrl, type: "image/png", sizes: "384x384" },
          { src: branding.logoUrl, type: "image/png", sizes: "512x512" }
        ],
        shortcuts: [
          {
            name: "Agendar Horário",
            short_name: "Agendar",
            description: "Acessar a tela de agendamento de serviços.",
            url: "/#services",
            icons: [{ src: branding.logoUrl, sizes: "96x96" }]
          },
          {
            name: "Minha Conta",
            short_name: "Conta",
            description: "Ver seu perfil e histórico de agendamentos.",
            url: "/#profile",
            icons: [{ src: branding.logoUrl, sizes: "96x96" }]
          }
        ]
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);
      
      const appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      appleIconLink.href = branding.logoUrl;
      document.head.appendChild(appleIconLink);

      const appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      appleTitleMeta.content = branding.appName;
      document.head.appendChild(appleTitleMeta);
    };

    updateManifestAndIcons(state.settings.branding);
    
  }, [state.settings.branding]);


  // Efeito para salvar o estado no DB e transmitir
  useEffect(() => {
    if (isLoading) return; // Não salva o estado inicial antes de carregar do DB
    saveStateToDB(state);
    
    // Send a structured message for better handling on the receiving end
    const message = {
        type: 'STATE_UPDATED',
        payload: state,
    };
    channel.postMessage(JSON.stringify(message));

    applyBranding(state.settings.branding);
  }, [state, isLoading, applyBranding]);

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
  
  const login = useCallback((email: string, password: string) => {
    const user = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
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
    const { password: _, ...userWithoutPassword } = newUser;
    setCurrentUser(userWithoutPassword);
    setIsAdminView(false);
  }, [state.clients, setState]);

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
  }, [state.clients, setState]);


  const contextValue = useMemo(() => ({ state, setState, currentUser, login, logout, register, resetPassword, isAdminView, setIsAdminView }), [state, currentUser, login, logout, register, resetPassword, setState, isAdminView, setIsAdminView]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isMaintenance = state.settings.maintenanceMode.enabled;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AppContext.Provider value={contextValue}>
      <Suspense fallback={<LoadingSpinner />}>
        {isMaintenance && !isAdmin ? (
          <MaintenanceMode />
        ) : !currentUser ? (
          <AuthPage />
        ) : (
          <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
            {!isOnline && <SyncStatusIndicator />}
            
            {isMaintenance && isAdmin && (
                <div className="bg-yellow-400 text-yellow-900 text-center p-2 z-[100] flex items-center justify-center text-sm shadow-lg sticky top-0 font-semibold">
                    <AlertTriangleIcon className="h-5 w-5 mr-2" />
                    MODO MANUTENÇÃO ATIVO
                </div>
            )}

            <div className={!isOnline ? 'pt-10' : ''}>
              {isAdminView ? <AdminView /> : <ClientView />}
            </div>
            
            {installPromptEvent && !isAdminView && <PWAInstallPrompt onInstall={handleInstallClick} />}

            {currentUser.role === 'admin' && !isAdminView && (
              <button
                onClick={() => setIsAdminView(true)}
                className="fixed bottom-20 left-4 z-50 bg-secondary text-white pl-3 pr-4 py-3 rounded-full shadow-lg hover:bg-secondary-dark transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary flex items-center gap-2"
                aria-label="Voltar ao Painel do Admin"
                title="Voltar ao Painel do Admin"
              >
                <ShieldCheckIcon className="h-6 w-6" />
                <span className="font-semibold text-sm">Voltar ao Admin</span>
              </button>
            )}
          </div>
        )}
      </Suspense>
    </AppContext.Provider>
  );
}