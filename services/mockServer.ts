// ====================================================================================
// !! SERVIDOR SIMULADO (MOCK SERVER) COM AMBIENTE DE TESTE !!
// ====================================================================================
// Este arquivo simula um backend. Ele pode operar com dois "bancos de dados"
// (chaves no localStorage) distintos: um para produção e outro para teste,
// permitindo experimentação segura sem afetar os dados reais.
// ====================================================================================

import { AppState, Service, Promotion, Appointment, AppointmentStatus, Client, BrandingSettings, AppSettings } from '../types';
import { INITIAL_APP_STATE } from '../constants';

const PROD_DB_KEY = 'agendaLinkServerState';
const TEST_DB_KEY = 'agendaLinkServerState_TEST';
let isTestMode = false;

const getServerDbKey = () => (isTestMode ? TEST_DB_KEY : PROD_DB_KEY);

const NETWORK_DELAY = 500; // ms para simular latência da rede

// Helper para simular a assincronicidade das chamadas de rede
const withDelay = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(data), NETWORK_DELAY);
    });
};

// --- Funções do "Banco de Dados" do Servidor ---

// Garante que o servidor tenha dados iniciais se for a primeira vez que é executado
export const initializeMockServer = () => {
    if (!localStorage.getItem(PROD_DB_KEY)) {
        console.log("Mock Server: Initializing production with default state.");
        localStorage.setItem(PROD_DB_KEY, JSON.stringify(INITIAL_APP_STATE));
    }
};

// Função para ativar/desativar o modo de teste.
// Ao ativar pela primeira vez, copia os dados de produção para o ambiente de teste.
export const setTestMode = (enabled: boolean) => {
    if (enabled && !localStorage.getItem(TEST_DB_KEY)) {
        console.log("Mock Server: Creating test environment from a copy of production data.");
        const prodData = localStorage.getItem(PROD_DB_KEY);
        if (prodData) {
            localStorage.setItem(TEST_DB_KEY, prodData);
        } else {
            // Se não houver dados de produção, inicializa o teste com o estado padrão.
             localStorage.setItem(TEST_DB_KEY, JSON.stringify(INITIAL_APP_STATE));
        }
    }
    console.log(`Mock Server: Test mode is now ${enabled ? 'ON' : 'OFF'}.`);
    isTestMode = enabled;
};

// Remove os dados do ambiente de teste.
export const resetTestEnvironment = () => {
    localStorage.removeItem(TEST_DB_KEY);
    console.log("Mock Server: Test environment data has been cleared.");
};

const getRawServerState = (): AppState => {
    const data = localStorage.getItem(getServerDbKey());
    return data ? JSON.parse(data) : INITIAL_APP_STATE;
};

const saveServerState = (state: AppState): void => {
    localStorage.setItem(getServerDbKey(), JSON.stringify(state));
};

// --- Endpoints da API Simulada ---

// --- Auth ---
export const login = (email: string, password: string): Promise<{ token: string; user: Client }> => {
    const state = getRawServerState();
    const user = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === password) {
        const { password, ...userWithoutPassword } = user;
        return withDelay({ token: user.id, user: userWithoutPassword as Client });
    }
    return Promise.reject(new Error('Email ou senha inválidos.'));
};

export const registerClient = (newUserData: Omit<Client, 'id'>): Promise<{ token: string; user: Client }> => {
    const state = getRawServerState();
    if (state.clients.some(c => c.email.toLowerCase() === newUserData.email.toLowerCase())) {
        return Promise.reject(new Error('Este email já está em uso.'));
    }
    const newUser: Client = {
        ...newUserData,
        id: `client_${Date.now()}`
    };
    const newState = { ...state, clients: [...state.clients, newUser] };
    saveServerState(newState);

    const { password, ...userWithoutPassword } = newUser;
    return withDelay({ token: newUser.id, user: userWithoutPassword as Client });
};

export const resetPasswordForEmail = (email: string): Promise<string> => {
    const state = getRawServerState();
    const clientIndex = state.clients.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    if (clientIndex === -1) {
        return Promise.reject(new Error('Email não encontrado.'));
    }
    const newPassword = Math.random().toString(36).slice(-8);
    state.clients[clientIndex].password = newPassword;
    saveServerState(state);
    return withDelay(newPassword);
};

// --- Data Fetching ---
export const getServerState = (): Promise<AppState> => {
    return withDelay(getRawServerState());
};

// --- Mutações ---
type ServerModifier = (state: AppState) => AppState;

const modifyServerState = (modifier: ServerModifier): Promise<void> => {
    const currentState = getRawServerState();
    const newState = modifier(currentState);
    saveServerState(newState);
    return withDelay(undefined);
}

export const addOrUpdateService = (service: Service): Promise<void> => modifyServerState(state => {
    const index = state.services.findIndex(s => s.id === service.id);
    const newServices = [...state.services];
    if (index > -1) newServices[index] = service;
    else newServices.push(service);
    return { ...state, services: newServices };
});

export const deleteService = (serviceId: string): Promise<void> => modifyServerState(state => ({
    ...state,
    services: state.services.filter(s => s.id !== serviceId),
}));

export const addOrUpdatePromotion = (promotion: Promotion): Promise<void> => modifyServerState(state => {
    const index = state.promotions.findIndex(p => p.id === promotion.id);
    const newPromotions = [...state.promotions];
    if (index > -1) newPromotions[index] = promotion;
    else newPromotions.push(promotion);
    return { ...state, promotions: newPromotions };
});

export const deletePromotion = (promotionId: string): Promise<void> => modifyServerState(state => ({
    ...state,
    promotions: state.promotions.filter(p => p.id !== promotionId),
}));

export const createAppointment = (appointment: Appointment): Promise<void> => modifyServerState(state => ({
    ...state,
    appointments: [...state.appointments, appointment],
}));

export const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean): Promise<void> => modifyServerState(state => ({
    ...state,
    appointments: state.appointments.map(a => 
        a.id === appointmentId 
        ? { ...a, status, paymentConfirmed: paymentConfirmed !== undefined ? paymentConfirmed : a.paymentConfirmed }
        : a
    ),
}));

export const updateClientNotes = (clientId: string, notes: string): Promise<void> => modifyServerState(state => ({
    ...state,
    clients: state.clients.map(c => c.id === clientId ? { ...c, notes } : c),
}));

export const resetClientPassword = (clientId: string): Promise<string> => {
    const state = getRawServerState();
    const clientIndex = state.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) {
        return Promise.reject(new Error('Cliente não encontrado.'));
    }
    const newPassword = Math.random().toString(36).slice(-8);
    state.clients[clientIndex].password = newPassword;
    saveServerState(state);
    return withDelay(newPassword);
}

export const updateBrandingSettings = (branding: BrandingSettings): Promise<void> => modifyServerState(state => ({
    ...state,
    settings: { ...state.settings, branding },
}));

export const updatePixSettings = (pix: AppSettings['pixCredentials']): Promise<void> => modifyServerState(state => ({
    ...state,
    settings: { ...state.settings, pixCredentials: pix },
}));

export const updateMaintenanceMode = (maintenance: AppSettings['maintenanceMode']): Promise<void> => modifyServerState(state => ({
    ...state,
    settings: { ...state.settings, maintenanceMode: maintenance },
}));

// --- DANGER ZONE ---
export const dangerouslyReplaceState = (newState: AppState): Promise<void> => {
    saveServerState(newState);
    return withDelay(undefined);
};