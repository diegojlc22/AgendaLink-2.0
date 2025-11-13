// ====================================================================================
// !! ARQUITETURA LOCAL-FIRST COM SQLITE !!
// ====================================================================================
// Este arquivo foi refatorado para se comunicar com um banco de dados SQLite
// local no navegador, através do `database.ts`. A comunicação com um backend
// foi removida para criar uma experiência PWA 100% offline.
// ====================================================================================

import { AppState, Service, Promotion, Appointment, AppointmentStatus, Client, BrandingSettings, AppSettings } from '../types';
import { loadStateFromDB, saveStateToDB } from './database';
import { INITIAL_APP_STATE } from '../constants';

// Helper to get the full state. If DB is empty, it initializes with default state.
const getState = (): AppState => {
    return loadStateFromDB() || INITIAL_APP_STATE;
};

// Helper to update and save the state.
const updateState = (modifier: (state: AppState) => AppState): void => {
    const currentState = getState();
    const newState = modifier(currentState);
    saveStateToDB(newState);
};

// --- Auth ---
export const apiLogin = (email: string, password: string): Promise<{ token: string; user: Client }> => {
    return new Promise((resolve, reject) => {
        const state = getState();
        const user = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (user && user.password === password) {
            const { password, ...userWithoutPassword } = user;
            // O "token" agora é apenas o ID do usuário para o gerenciamento da sessão no lado do cliente
            resolve({ token: user.id, user: userWithoutPassword as Client });
        } else {
            reject(new Error('Email ou senha inválidos.'));
        }
    });
};

export const apiRegisterClient = (newUserData: Omit<Client, 'id'>): Promise<{ token: string; user: Client }> => {
    return new Promise((resolve, reject) => {
        let newUser: Client | null = null;
        updateState(state => {
            if (state.clients.some(c => c.email.toLowerCase() === newUserData.email.toLowerCase())) {
                reject(new Error('Este email já está em uso.'));
                return state; // retorna o estado original
            }
            newUser = {
                ...newUserData,
                id: `client_${Date.now()}`
            };
            return {
                ...state,
                clients: [...state.clients, newUser]
            };
        });
        if (newUser) {
            const { password, ...userWithoutPassword } = newUser;
            resolve({ token: newUser.id, user: userWithoutPassword as Client });
        }
    });
};

export const apiGetCurrentUser = (): Promise<Client> => {
    return new Promise((resolve, reject) => {
        const currentUserId = localStorage.getItem('agendaLinkAuthToken');
        if (!currentUserId) {
            reject(new Error('Nenhum usuário logado.'));
            return;
        }
        const state = getState();
        const user = state.clients.find(c => c.id === currentUserId);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            resolve(userWithoutPassword as Client);
        } else {
            reject(new Error('Usuário não encontrado.'));
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

export const apiResetPasswordForEmail = (email: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        let newPassword = '';
        updateState(state => {
            const clientIndex = state.clients.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
            if (clientIndex === -1) {
                reject(new Error('Email não encontrado.'));
                return state;
            }
            newPassword = generateRandomPassword();
            const updatedClients = [...state.clients];
            updatedClients[clientIndex] = { ...updatedClients[clientIndex], password: newPassword };
            return { ...state, clients: updatedClients };
        });
        if (newPassword) {
            resolve(newPassword);
        }
    });
};

// --- Data Fetching ---
export const apiGetState = (): AppState => {
    return getState();
};

// --- Service Endpoints ---
export const apiAddOrUpdateService = (service: Service): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => {
            const index = state.services.findIndex(s => s.id === service.id);
            const newServices = [...state.services];
            if (index > -1) newServices[index] = service;
            else newServices.push(service);
            return { ...state, services: newServices };
        });
        resolve();
    });
};

export const apiDeleteService = (serviceId: string): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            services: state.services.filter(s => s.id !== serviceId),
        }));
        resolve();
    });
};

// --- Promotion Endpoints ---
export const apiAddOrUpdatePromotion = (promotion: Promotion): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => {
            const index = state.promotions.findIndex(p => p.id === promotion.id);
            const newPromotions = [...state.promotions];
            if (index > -1) newPromotions[index] = promotion;
            else newPromotions.push(promotion);
            return { ...state, promotions: newPromotions };
        });
        resolve();
    });
};

export const apiDeletePromotion = (promotionId: string): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            promotions: state.promotions.filter(p => p.id !== promotionId),
        }));
        resolve();
    });
};

// --- Appointment Endpoints ---
export const apiCreateAppointment = (appointment: Appointment): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            appointments: [...state.appointments, appointment],
        }));
        resolve();
    });
};

export const apiUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            appointments: state.appointments.map(a => {
                if (a.id === appointmentId) {
                    return { ...a, status, paymentConfirmed: paymentConfirmed !== undefined ? paymentConfirmed : a.paymentConfirmed };
                }
                return a;
            }),
        }));
        resolve();
    });
};

// --- Client Endpoints ---
export const apiUpdateClientNotes = (clientId: string, notes: string): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            clients: state.clients.map(c => c.id === clientId ? { ...c, notes } : c),
        }));
        resolve();
    });
};

export const apiResetClientPassword = (clientId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        let newPassword = '';
        updateState(state => {
            const clientIndex = state.clients.findIndex(c => c.id === clientId);
            if (clientIndex === -1) {
                reject(new Error('Cliente não encontrado.'));
                return state;
            }
            newPassword = generateRandomPassword();
            const updatedClients = [...state.clients];
            updatedClients[clientIndex].password = newPassword;
            return { ...state, clients: updatedClients };
        });
        if (newPassword) {
            resolve(newPassword);
        }
    });
};

// --- Settings Endpoints ---
export const apiUpdateBrandingSettings = (branding: BrandingSettings): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            settings: { ...state.settings, branding },
        }));
        resolve();
    });
};

export const apiUpdatePixSettings = (pix: AppSettings['pixCredentials']): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            settings: { ...state.settings, pixCredentials: pix },
        }));
        resolve();
    });
};

export const apiUpdateMaintenanceMode = (maintenance: AppSettings['maintenanceMode']): Promise<void> => {
    return new Promise(resolve => {
        updateState(state => ({
            ...state,
            settings: { ...state.settings, maintenanceMode: maintenance },
        }));
        resolve();
    });
};

// --- DANGER ZONE ---
export const apiDangerouslyReplaceState = (newState: AppState): Promise<void> => {
    return new Promise(resolve => {
        saveStateToDB(newState);
        resolve();
    });
};