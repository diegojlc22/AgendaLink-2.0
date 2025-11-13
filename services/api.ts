
// ====================================================================================
// !! ARQUITETURA DE SERVIDOR REAL !!
// ====================================================================================
// Este arquivo foi refatorado para se comunicar com um backend real. A simulação
// que usava `localStorage` foi removida. Para que a aplicação funcione, você
// precisa construir e rodar um servidor que exponha os endpoints de API descritos
// abaixo.
//
// TECNOLOGIAS RECOMENDADAS PARA O BACKEND:
// - Servidor: Node.js com Express.js
// - Banco de Dados: PostgreSQL
// - ORM: Prisma (para facilitar a interação com o banco de dados)
// - Tempo Real: Socket.IO (para WebSockets)
// - Autenticação: JWT (JSON Web Tokens) e `bcrypt` para hashing de senhas.
// ====================================================================================

import { AppState, Service, Promotion, Appointment, AppointmentStatus, Client, BrandingSettings, AppSettings } from '../types';

const BASE_URL = 'http://localhost:3001/api'; // URL do seu servidor backend

const getToken = () => localStorage.getItem('agendaLinkAuthToken');

// Helper para fazer chamadas de API, incluindo o token de autenticação
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    // FIX: The previous method of creating headers was not type-safe because `options.headers`
    // can be a Headers object, which cannot be spread into a plain object.
    // Using the `Headers` constructor is the correct and robust way to handle this.
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ocorreu um erro na comunicação com o servidor.');
    }
    
    if (response.status === 204) {
        return {};
    }

    return response.json();
};


// --- Auth Endpoints ---

// Backend: `POST /api/auth/login` - Body: { email, password }. Retorna: { token, user }
export const apiLogin = (email: string, password: string): Promise<{ token: string; user: Client }> => {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

// Backend: `POST /api/auth/register` - Body: Omit<Client, 'id'>. Retorna: { token, user }
export const apiRegisterClient = (newUser: Omit<Client, 'id'>): Promise<{ token: string; user: Client }> => {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser),
    });
};

// Backend: `GET /api/auth/me` - Valida o token e retorna o usuário logado.
export const apiGetCurrentUser = (): Promise<Client> => apiFetch('/auth/me');

// Backend: `POST /api/auth/forgot-password` - Body: { email }. Retorna: { newPassword }
export const apiResetPasswordForEmail = (email: string): Promise<string> => {
    return apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }).then(data => data.newPassword);
};


// --- Data Fetching ---

// Backend: Deve ter endpoints para cada tipo de dado (ex: GET /api/services).
export const apiGetState = async (): Promise<AppState> => {
    const [services, clients, appointments, promotions, settings] = await Promise.all([
        apiFetch('/data/services'),
        apiFetch('/data/clients'),
        apiFetch('/data/appointments'),
        apiFetch('/data/promotions'),
        apiFetch('/data/settings'),
    ]);
    return { services, clients, appointments, promotions, settings, pixTransactions: [] };
};


// --- Service Endpoints ---

// Backend: `POST /api/services` (Upsert logic: cria se não existir, atualiza se existir) - Body: Service
export const apiAddOrUpdateService = (service: Service): Promise<Service> => {
    return apiFetch(`/services`, { method: 'POST', body: JSON.stringify(service) });
};

// Backend: `DELETE /api/services/:id`
export const apiDeleteService = (serviceId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/services/${serviceId}`, { method: 'DELETE' });
};


// --- Promotion Endpoints ---

// Backend: `POST /api/promotions` (Upsert logic) - Body: Promotion
export const apiAddOrUpdatePromotion = (promotion: Promotion): Promise<Promotion> => {
    return apiFetch('/promotions', { method: 'POST', body: JSON.stringify(promotion) });
};

// Backend: `DELETE /api/promotions/:id`
export const apiDeletePromotion = (promotionId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/promotions/${promotionId}`, { method: 'DELETE' });
};


// --- Appointment Endpoints ---

// Backend: `POST /api/appointments` - Body: Appointment
export const apiCreateAppointment = (appointment: Appointment): Promise<Appointment> => {
    return apiFetch('/appointments', { method: 'POST', body: JSON.stringify(appointment) });
};

// Backend: `PUT /api/appointments/:id/status` - Body: { status, paymentConfirmed }
export const apiUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean): Promise<Appointment> => {
    return apiFetch(`/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, paymentConfirmed }),
    });
};


// --- Client Endpoints ---

// Backend: `PUT /api/clients/:id/notes` - Body: { notes }
export const apiUpdateClientNotes = (clientId: string, notes: string): Promise<Client> => {
    return apiFetch(`/clients/${clientId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
    });
};

// Backend: `POST /api/clients/:id/reset-password` - Retorna: { newPassword }
export const apiResetClientPassword = (clientId: string): Promise<string> => {
    return apiFetch(`/clients/${clientId}/reset-password`, { method: 'POST' })
        .then(data => data.newPassword);
};


// --- Settings Endpoints ---

// Backend: `PUT /api/settings/branding` - Body: BrandingSettings
export const apiUpdateBrandingSettings = (branding: BrandingSettings): Promise<BrandingSettings> => {
    return apiFetch('/settings/branding', { method: 'PUT', body: JSON.stringify(branding) });
};

// Backend: `PUT /api/settings/pix` - Body: AppSettings['pixCredentials']
export const apiUpdatePixSettings = (pix: AppSettings['pixCredentials']): Promise<AppSettings['pixCredentials']> => {
    return apiFetch('/settings/pix', { method: 'PUT', body: JSON.stringify(pix) });
};

// Backend: `PUT /api/settings/maintenance` - Body: AppSettings['maintenanceMode']
export const apiUpdateMaintenanceMode = (maintenance: AppSettings['maintenanceMode']): Promise<AppSettings['maintenanceMode']> => {
    return apiFetch('/settings/maintenance', { method: 'PUT', body: JSON.stringify(maintenance) });
};


// --- DANGER ZONE ---

// Backend: `POST /api/data/replace` - Body: AppState
export const apiDangerouslyReplaceState = (newState: AppState): Promise<{ success: boolean }> => {
    return apiFetch('/data/replace', { method: 'POST', body: JSON.stringify(newState) });
};
