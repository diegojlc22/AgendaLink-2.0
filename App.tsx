
import React, { useState, createContext, useContext, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { AppState, BrandingSettings, Client, Service, Promotion, Appointment, AppointmentStatus, AppSettings, AppContextType, SyncState } from './types';
import { INITIAL_APP_STATE } from './constants';
import * as api from './services/api';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { AlertTriangleIcon, WifiOffIcon, ShieldCheckIcon } from './components/common/Icons';
import { initDatabase, loadStateFromDB, saveStateToDB } from './services/database';

const ClientView = lazy(() => import('./components/client/ClientView'));
const AdminView = lazy(() => import('./components/admin/AdminView'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));


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

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
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

const OfflineIndicator: React.FC = () => (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center p-2 z-[100] flex items-center justify-center text-sm shadow-lg">
        <WifiOffIcon className="h-5 w-5 mr-2" />
        Você está offline. O aplicativo continuará funcionando normalmente.
    </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  </div>
);


export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  
  const [currentUser, setCurrentUser] = useState<Omit<Client, 'password'> | null>(null);
  
  const [isAdminView, setIsAdminView] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const forceSync = useCallback(() => {
    setSyncState('syncing');
    try {
        const freshState = api.apiGetState();
        setState(freshState);
        setSyncState('synced');
    } catch (error) {
        console.error("Failed to load state from DB:", error);
        setSyncState('error');
    }
  }, []);


  // Efeito para verificar o "token" (ID do usuário) de autenticação na inicialização
  useEffect(() => {
    const verifyUser = async () => {
        const userId = localStorage.getItem('agendaLinkAuthToken');
        if (userId) {
            try {
                // apiGetCurrentUser agora lê do banco de dados local
                const user = await api.apiGetCurrentUser();
                setCurrentUser(user);
                setIsAdminView(user.role === 'admin');
            } catch (error) {
                console.error("User verification failed:", error);
                localStorage.removeItem('agendaLinkAuthToken');
                setCurrentUser(null);
            }
        }
        setIsAuthLoading(false);
    };
    verifyUser();
  }, []);

  // Efeito para inicializar o banco de dados e carregar o estado inicial
  useEffect(() => {
    const initializeApp = async () => {
      await initDatabase();
      const localState = api.apiGetState(); // Isso vai carregar do DB ou retornar o estado inicial
      
      // Se o DB estava vazio, isso garante que o estado inicial seja salvo
      if (!loadStateFromDB()) {
          saveStateToDB(localState);
      }
      
      setState(localState);
      setIsLoading(false);
    };
    initializeApp();
  }, [currentUser]); // Recarrega o estado quando o usuário muda (login/logout)


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

  useEffect(() => {
    const updateManifestAndIcons = (branding: BrandingSettings) => {
      document.querySelector('link[rel="manifest"]')?.remove();
      document.querySelector('link[rel="apple-touch-icon"]')?.remove();
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.remove();
      if (!branding.appName || !branding.logoUrl) return;
      const manifest = {
        short_name: branding.appName.substring(0, 12),
        name: branding.appName,
        description: "An all-in-one web application for beauty professionals...",
        lang: "pt-BR", start_url: "/", display: "standalone", orientation: "portrait-primary",
        theme_color: branding.colors.primary, background_color: "#f3f4f6",
        icons: [72, 96, 128, 144, 152, 192, 384, 512].map(size => ({
          src: branding.logoUrl, type: "image/png", sizes: `${size}x${size}`,
          ...(size === 192 && { purpose: "any maskable" })
        })),
        shortcuts: [{ name: "Agendar Horário", short_name: "Agendar", url: "/#services", icons: [{ src: branding.logoUrl, sizes: "96x96" }] },
                    { name: "Minha Conta", short_name: "Conta", url: "/#profile", icons: [{ src: branding.logoUrl, sizes: "96x96" }] }]
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

  useEffect(() => {
    if (isLoading) return;
    // O state é salvo no DB através das funções de API agora, mas
    // podemos manter isso para garantir a sincronização entre abas
    const message = { type: 'STATE_UPDATED', payload: state };
    channel.postMessage(JSON.stringify(message));
    applyBranding(state.settings.branding);
  }, [state, isLoading, applyBranding]);

  const handleInstallClick = () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then(() => setInstallPromptEvent(null));
  };
  
  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.apiLogin(email, password);
    localStorage.setItem('agendaLinkAuthToken', token);
    setCurrentUser(user);
    setIsAdminView(user.role === 'admin');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agendaLinkAuthToken');
    setCurrentUser(null);
    setIsAdminView(false);
  }, []);

  const register = useCallback(async (newUserData: Omit<Client, 'id'>) => {
    const { token, user } = await api.apiRegisterClient(newUserData);
    localStorage.setItem('agendaLinkAuthToken', token);
    setCurrentUser(user);
    setIsAdminView(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const newPassword = await api.apiResetPasswordForEmail(email);
    forceSync();
    return newPassword;
  }, [forceSync]);

 const createUpdater = <T extends any[]>(apiCall: (...args: T) => Promise<any>) => {
    return async (...args: T) => {
        setSyncState('syncing');
        try {
            await apiCall(...args);
            const freshState = api.apiGetState();
            setState(freshState);
            setSyncState('synced');
        } catch (error) {
            console.error(`Local DB operation failed:`, error);
            setSyncState('error');
            alert(`Ocorreu um erro ao salvar os dados: ${error instanceof Error ? error.message : String(error)}`);
            const freshState = api.apiGetState();
            setState(freshState);
        }
    };
  };

  const addOrUpdateService = createUpdater(api.apiAddOrUpdateService);
  const deleteService = createUpdater(api.apiDeleteService);
  const addOrUpdatePromotion = createUpdater(api.apiAddOrUpdatePromotion);
  const deletePromotion = createUpdater(api.apiDeletePromotion);
  const createAppointment = createUpdater(api.apiCreateAppointment);
  const updateAppointmentStatus = createUpdater(api.apiUpdateAppointmentStatus);
  const updateClientNotes = createUpdater(api.apiUpdateClientNotes);
  const updateBrandingSettings = createUpdater(api.apiUpdateBrandingSettings);
  const updatePixSettings = createUpdater(api.apiUpdatePixSettings);
  const updateMaintenanceMode = createUpdater(api.apiUpdateMaintenanceMode);
  
  const resetClientPassword = useCallback(async (clientId: string) => {
      setSyncState('syncing');
      try {
          const newPassword = await api.apiResetClientPassword(clientId);
          forceSync();
          return newPassword;
      } catch (error) {
          console.error("Password reset failed:", error);
          setSyncState('error');
          alert(error instanceof Error ? error.message : "Ocorreu um erro.");
          throw error;
      }
  }, [forceSync]);

  const dangerouslyReplaceState = useCallback(async (newState: AppState) => {
    setSyncState('syncing');
    try {
        await api.apiDangerouslyReplaceState(newState);
        forceSync();
    } catch (error) {
        console.error("Data replacement failed:", error);
        setSyncState('error');
        alert(error instanceof Error ? error.message : "Ocorreu um erro ao substituir os dados.");
    }
  }, [forceSync]);

  const contextValue = useMemo(() => ({
      state, currentUser, login, logout, register, resetPassword, isAdminView, setIsAdminView,
      addOrUpdateService, deleteService, addOrUpdatePromotion, deletePromotion,
      createAppointment, updateAppointmentStatus, updateClientNotes, resetClientPassword,
      updateBrandingSettings, updatePixSettings, updateMaintenanceMode,
      dangerouslyReplaceState,
      syncState, forceSync
  }), [state, currentUser, login, logout, register, resetPassword, isAdminView, forceSync]);
  
  if (isLoading || isAuthLoading) return <LoadingSpinner />;

  const isMaintenance = state.settings.maintenanceMode.enabled;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AppContext.Provider value={contextValue}>
      <Suspense fallback={<LoadingSpinner />}>
        {isMaintenance && !isAdmin ? <MaintenanceMode /> : !currentUser ? <AuthPage /> : (
          <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
            {!isOnline && <OfflineIndicator />}
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
              <button onClick={() => setIsAdminView(true)} className="fixed bottom-20 left-4 z-50 bg-secondary text-white pl-3 pr-4 py-3 rounded-full shadow-lg hover:bg-secondary-dark transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary flex items-center gap-2" title="Voltar ao Painel do Admin">
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