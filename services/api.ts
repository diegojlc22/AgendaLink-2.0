// ====================================================================================
// !! ARQUITETURA HÍBRIDA: LOCAL-FIRST COM SINCRONIZAÇÃO !!
// ====================================================================================
// Este arquivo agora orquestra a comunicação entre o banco de dados local (SQLite)
// e um servidor central simulado (`mockServer.ts`).
// 1. As leituras e escritas são feitas PRIMEIRO no banco local para performance e
//    capacidade offline.
// 2. As escritas são, em seguida, enviadas para o servidor para sincronização.
// ====================================================================================

import { AppState, Service, Promotion, Appointment, AppointmentStatus, Client, BrandingSettings, AppSettings } from '../types';
import { loadStateFromDB, saveStateToDB } from './database';
import { INITIAL_APP_STATE } from '../constants';
import * as mockServer from './mockServer';

// Helper to get the full state from the local DB.
const getLocalState = (): AppState | null => {
    return loadStateFromDB();
};

// Helper to update and save the state locally.
const updateLocalState = (modifier: (state: AppState) => AppState): void => {
    // Garante que nunca operamos em um estado nulo, usando o estado inicial como fallback.
    // Isso adiciona robustez caso o banco de dados seja limpo ou corrompido durante a execução.
    const currentState = getLocalState() || INITIAL_APP_STATE;
    const newState = modifier(currentState);
    saveStateToDB(newState);
};

// --- Sincronização ---
export const apiSyncWithServer = async (): Promise<AppState> => {
    console.log("Starting sync with server...");
    const serverState = await mockServer.getServerState();
    saveStateToDB(serverState); // O servidor é a fonte da verdade
    console.log("Sync completed. Local DB updated with server state.");
    return serverState;
}

// --- Auth ---
export const apiLogin = async (email: string, password: string): Promise<{ token: string; user: Client }> => {
    const { token, user } = await mockServer.login(email, password);
    // Após o login bem-sucedido no servidor, sincronizamos os dados para garantir que o local está atualizado.
    await apiSyncWithServer();
    return { token, user };
};

export const apiRegisterClient = async (newUserData: Omit<Client, 'id'>): Promise<{ token: string; user: Client }> => {
    const { token, user } = await mockServer.registerClient(newUserData);
    await apiSyncWithServer(); // Sincroniza para obter o estado mais recente, incluindo o novo usuário
    return { token, user };
};

export const apiGetCurrentUser = (): Promise<Client> => {
    // Esta operação ainda é local para velocidade de inicialização do app
    return new Promise((resolve, reject) => {
        const currentUserId = localStorage.getItem('agendaLinkAuthToken');
        if (!currentUserId) {
            reject(new Error('Nenhum usuário logado.'));
            return;
        }
        const state = getLocalState();
        if (!state) {
            reject(new Error('Estado local não encontrado.'));
            return;
        }
        const user = state.clients.find(c => c.id === currentUserId);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            resolve(userWithoutPassword as Client);
        } else {
            // Isso pode acontecer se o DB local estiver dessincronizado
            reject(new Error('Usuário não encontrado localmente. Tente recarregar.'));
        }
    });
};

const generateRandomPassword = (length = 8) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

export const apiResetPasswordForEmail = async (email: string): Promise<string> => {
    const newPassword = await mockServer.resetPasswordForEmail(email);
    await apiSyncWithServer(); // Garante que a nova senha seja refletida localmente
    return newPassword;
};

// --- Data Fetching ---
export const apiGetLocalState = (): AppState | null => {
    return getLocalState();
};

// --- Service Endpoints ---
export const apiAddOrUpdateService = async (service: Service): Promise<void> => {
    updateLocalState(state => {
        const index = state.services.findIndex(s => s.id === service.id);
        const newServices = [...state.services];
        if (index > -1) newServices[index] = service;
        else newServices.push(service);
        return { ...state, services: newServices };
    });
    await mockServer.addOrUpdateService(service);
};

export const apiDeleteService = async (serviceId: string): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        services: state.services.filter(s => s.id !== serviceId),
    }));
    await mockServer.deleteService(serviceId);
};

// --- Promotion Endpoints ---
export const apiAddOrUpdatePromotion = async (promotion: Promotion): Promise<void> => {
    updateLocalState(state => {
        const index = state.promotions.findIndex(p => p.id === promotion.id);
        const newPromotions = [...state.promotions];
        if (index > -1) newPromotions[index] = promotion;
        else newPromotions.push(promotion);
        return { ...state, promotions: newPromotions };
    });
    await mockServer.addOrUpdatePromotion(promotion);
};

export const apiDeletePromotion = async (promotionId: string): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        promotions: state.promotions.filter(p => p.id !== promotionId),
    }));
    await mockServer.deletePromotion(promotionId);
};

// --- Appointment Endpoints ---
export const apiCreateAppointment = async (appointment: Appointment): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        appointments: [...state.appointments, appointment],
    }));
    await mockServer.createAppointment(appointment);
};

export const apiUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        appointments: state.appointments.map(a => {
            if (a.id === appointmentId) {
                return { ...a, status, paymentConfirmed: paymentConfirmed !== undefined ? paymentConfirmed : a.paymentConfirmed };
            }
            return a;
        }),
    }));
    await mockServer.updateAppointmentStatus(appointmentId, status, paymentConfirmed);
};

// --- Client Endpoints ---
export const apiUpdateClientNotes = async (clientId: string, notes: string): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        clients: state.clients.map(c => c.id === clientId ? { ...c, notes } : c),
    }));
    await mockServer.updateClientNotes(clientId, notes);
};

export const apiResetClientPassword = async (clientId: string): Promise<string> => {
    const newPassword = await mockServer.resetClientPassword(clientId);
    await apiSyncWithServer(); // Sincroniza para garantir que a nova senha esteja no DB local
    return newPassword;
};

// --- Settings Endpoints ---
export const apiUpdateBrandingSettings = async (branding: BrandingSettings): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        settings: { ...state.settings, branding },
    }));
    await mockServer.updateBrandingSettings(branding);
};

export const apiUpdatePixSettings = async (pix: AppSettings['pixCredentials']): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        settings: { ...state.settings, pixCredentials: pix },
    }));
    await mockServer.updatePixSettings(pix);
};

export const apiUpdateMaintenanceMode = async (maintenance: AppSettings['maintenanceMode']): Promise<void> => {
    updateLocalState(state => ({
        ...state,
        settings: { ...state.settings, maintenanceMode: maintenance },
    }));
    await mockServer.updateMaintenanceMode(maintenance);
};

// --- DANGER ZONE ---
export const apiDangerouslyReplaceState = async (newState: AppState): Promise<void> => {
    // Esta operação afeta tanto o local quanto o servidor para ser um "reset" completo.
    saveStateToDB(newState);
    await mockServer.dangerouslyReplaceState(newState);
};
