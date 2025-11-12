import { AppState, Service, Client, Appointment, AppointmentStatus, Promotion } from './types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const createDate = (day: Date, hour: number, minute: number) => {
    const date = new Date(day);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
};

export const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Corte de Cabelo Feminino', description: 'Corte moderno e estilizado.', price: 80, duration: 60, category: 'Cabelo', isFeatured: true },
  { id: '2', name: 'Manicure Completa', description: 'Cutilagem, esmaltação e hidratação.', price: 30, duration: 45, category: 'Unhas' },
  { id: '3', name: 'Design de Sobrancelha', description: 'Modelagem com pinça e linha.', price: 40, duration: 30, category: 'Estética Facial' },
  { id: '4', name: 'Massagem Relaxante', description: '60 minutos de pura tranquilidade.', price: 150, duration: 60, category: 'Corpo' },
  { id: '5', name: 'Escova Progressiva', description: 'Alisamento e redução de volume.', price: 250, duration: 180, category: 'Cabelo' },
];

export const DEFAULT_CLIENTS: Client[] = [
  { id: '1', name: 'Ana Silva (Cliente)', email: 'cliente@agendalink.com', phone: '11987654321', password: '123', role: 'client' },
  { id: '2', name: 'Carlos Pereira (Admin)', email: 'admin@admin', phone: '21912345678', password: 'admin', role: 'admin' },
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  { id: '1', serviceId: '1', clientId: '1', startTime: createDate(today, 14, 0), endTime: createDate(today, 15, 0), status: AppointmentStatus.Confirmed, paymentMethod: 'Local', paymentConfirmed: true, finalPrice: 80 },
  { id: '2', serviceId: '2', clientId: '2', startTime: createDate(tomorrow, 10, 0), endTime: createDate(tomorrow, 10, 45), status: AppointmentStatus.Pending, paymentMethod: 'Pix', paymentConfirmed: false, finalPrice: 30 },
  { id: '3', serviceId: '3', clientId: '1', startTime: createDate(tomorrow, 11, 0), endTime: createDate(tomorrow, 11, 30), status: AppointmentStatus.Pending, paymentMethod: 'Local', paymentConfirmed: false, finalPrice: 40 },
];

const promoStartDate = new Date();
const promoEndDate = new Date();
promoEndDate.setDate(promoEndDate.getDate() + 7);

export const DEFAULT_PROMOTIONS: Promotion[] = [
    { 
        id: '1', 
        title: 'Semana da Beleza', 
        description: '20% de desconto em todos os serviços de cabelo!', 
        serviceIds: ['1', '5'], 
        promoCode: 'BELEZA20',
        type: 'percentage',
        value: 20,
        startDate: promoStartDate.toISOString(),
        endDate: promoEndDate.toISOString(),
        usageLimit: 100,
        uses: 12,
        isActive: true,
    }
];

export const INITIAL_APP_STATE: AppState = {
  services: DEFAULT_SERVICES,
  clients: DEFAULT_CLIENTS,
  appointments: DEFAULT_APPOINTMENTS,
  promotions: DEFAULT_PROMOTIONS,
  pixTransactions: [],
  settings: {
    branding: {
      appName: 'AgendaLink 2.0',
      logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500',
      colors: {
        primary: '#6366f1',
        secondary: '#ec4899',
        accent: '#fbbf24',
      },
    },
    pixCredentials: {
      apiKey: '',
      apiSecret: '',
    },
    maintenanceMode: {
      enabled: false,
      message: 'Estamos em manutenção. Voltamos em breve!',
    },
  },
};