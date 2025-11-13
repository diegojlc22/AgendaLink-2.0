// ====================================================================================
// !! IMPORTANTE: MOCK DE SERVIDOR !!
// ====================================================================================
// Este arquivo simula um backend para fins de demonstração.
// Ele usa o `localStorage` do navegador para persistir os dados.
//
// **LIMITAÇÃO CONHECIDA:** O `localStorage` é isolado por navegador.
// Isso significa que os dados não serão sincronizados entre navegadores diferentes
// (ex: Chrome e Firefox) ou entre abas anônimas e normais. A sincronização em
// tempo real funcionará perfeitamente entre múltiplas abas *do mesmo navegador*.
//
// Em um ambiente de produção, este arquivo seria substituído por chamadas de API
// a um servidor real (ex: Node.js, Python, etc.) com um banco de dados central.
// ====================================================================================

import { AppState, Service, Promotion, Appointment, AppointmentStatus, Client, BrandingSettings, AppSettings } from '../types';
import { INITIAL_APP_STATE } from '../constants';

// --- Mock do Banco de Dados do Servidor ---
// Usamos localStorage para persistir o estado do servidor mockado entre recarregamentos.
let serverState: AppState = (() => {
    try {
        const storedState = localStorage.getItem('mockServerState');
        if (storedState) {
            return JSON.parse(storedState);
        }
        // Se não houver estado salvo, inicialize com o padrão e salve-o.
        const initialState = JSON.parse(JSON.stringify(INITIAL_APP_STATE));
        localStorage.setItem('mockServerState', JSON.stringify(initialState));
        return initialState;
    } catch (e) {
        return JSON.parse(JSON.stringify(INITIAL_APP_STATE));
    }
})();


const saveServerState = () => {
    localStorage.setItem('mockServerState', JSON.stringify(serverState));
};

const FAKE_LATENCY = 400; // Simula a latência da rede

// Helper para simular uma chamada de API assíncrona
const mockApiCall = <T>(callback: () => T): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simula uma falha de rede aleatória (5% de chance) para testar a resiliência
            if (Math.random() < 0.05) {
                reject(new Error("Falha de rede simulada. Tente novamente."));
                return;
            }
            try {
                const result = callback();
                saveServerState(); // Persiste o estado após cada operação bem-sucedida
                resolve(JSON.parse(JSON.stringify(result))); // Retorna uma cópia profunda para evitar mutações
            } catch (e) {
                reject(e);
            }
        }, FAKE_LATENCY);
    });
};

// --- Funções da API ---

export const apiGetState = () => mockApiCall(() => serverState);

export const apiAddOrUpdateService = (service: Service) => mockApiCall(() => {
    const index = serverState.services.findIndex(s => s.id === service.id);
    if (index > -1) serverState.services[index] = service;
    else serverState.services.push(service);
    return service;
});

export const apiDeleteService = (serviceId: string) => mockApiCall(() => {
    serverState.services = serverState.services.filter(s => s.id !== serviceId);
    return { success: true };
});

export const apiAddOrUpdatePromotion = (promotion: Promotion) => mockApiCall(() => {
    const index = serverState.promotions.findIndex(p => p.id === promotion.id);
    if (index > -1) serverState.promotions[index] = promotion;
    else serverState.promotions.push(promotion);
    return promotion;
});

export const apiDeletePromotion = (promotionId: string) => mockApiCall(() => {
    serverState.promotions = serverState.promotions.filter(p => p.id !== promotionId);
    return { success: true };
});

export const apiCreateAppointment = (appointment: Appointment) => mockApiCall(() => {
    serverState.appointments.push(appointment);
    return appointment;
});

export const apiUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean) => mockApiCall(() => {
    const index = serverState.appointments.findIndex(a => a.id === appointmentId);
    if (index > -1) {
        serverState.appointments[index].status = status;
        if (paymentConfirmed !== undefined) {
            serverState.appointments[index].paymentConfirmed = paymentConfirmed;
        }
    }
    return serverState.appointments[index];
});

export const apiUpdateClientNotes = (clientId: string, notes: string) => mockApiCall(() => {
    const index = serverState.clients.findIndex(c => c.id === clientId);
    if (index > -1) serverState.clients[index].notes = notes;
    return serverState.clients[index];
});

export const apiResetClientPassword = (clientId: string) => mockApiCall(() => {
    const userIndex = serverState.clients.findIndex(c => c.id === clientId);
    if (userIndex === -1) throw new Error('Cliente não encontrado.');
    const newPassword = Math.random().toString(36).slice(-8);
    serverState.clients[userIndex].password = newPassword;
    return newPassword;
});

export const apiRegisterClient = (newUser: Client) => mockApiCall(() => {
    if (serverState.clients.some(c => c.email.toLowerCase() === newUser.email.toLowerCase())) {
        throw new Error('Este e-mail já está em uso.');
    }
    serverState.clients.push(newUser);
    return newUser;
});

export const apiLogin = (email: string, password: string): Promise<Client> => mockApiCall(() => {
    const user = serverState.clients.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
    if (!user) throw new Error('Email ou senha inválidos.');
    return user;
});

export const apiUpdateBrandingSettings = (branding: BrandingSettings) => mockApiCall(() => {
    serverState.settings.branding = branding;
    return branding;
});

export const apiUpdatePixSettings = (pix: AppSettings['pixCredentials']) => mockApiCall(() => {
    serverState.settings.pixCredentials = pix;
    return pix;
});

export const apiUpdateMaintenanceMode = (maintenance: AppSettings['maintenanceMode']) => mockApiCall(() => {
    serverState.settings.maintenanceMode = maintenance;
    return maintenance;
});

export const apiDangerouslyReplaceState = (newState: AppState) => mockApiCall(() => {
    serverState = newState;
    return { success: true };
});

export const apiResetPasswordForEmail = (email: string) => mockApiCall(() => {
    const userIndex = serverState.clients.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) throw new Error('E-mail não encontrado.');
    const newPassword = Math.random().toString(36).slice(-8);
    serverState.clients[userIndex].password = newPassword;
    return newPassword;
});