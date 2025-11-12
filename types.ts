export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  isFeatured?: boolean;
}

export enum AppointmentStatus {
  Pending = 'Pendente',
  Confirmed = 'Confirmado',
  Cancelled = 'Cancelado',
  Completed = 'Concluído',
}

export interface Appointment {
  id: string;
  serviceId: string;
  clientId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: AppointmentStatus;
  paymentMethod: 'Pix' | 'Local';
  paymentConfirmed: boolean;
  notes?: string;
  appliedPromoId?: string;
  finalPrice: number;
}

export interface Client {
  id:string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  password: string;
  role: 'client' | 'admin';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  promoCode?: string;
  type: 'percentage' | 'fixed';
  value: number; // The discount value
  serviceIds: string[];
  startDate: string; // ISO string
  endDate: string; // ISO string
  usageLimit?: number; // Optional total usage limit
  uses: number; // How many times it has been used
  isActive: boolean;
}


export interface PixTransaction {
  id: string;
  appointmentId: string;
  amount: number;
  status: 'paid' | 'refunded';
  createdAt: string; // ISO string
}

export interface BrandingSettings {
  appName: string;
  logoUrl: string;
  colors: {
    primary: string; // hex
    secondary: string; // hex
    accent: string; // hex
  };
}

export interface AppSettings {
  branding: BrandingSettings;
  pixCredentials: {
    apiKey: string;
    apiSecret: string;
  };
  maintenanceMode: {
    enabled: boolean;
    message: string;
  };
}

export type AppState = {
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  promotions: Promotion[];
  pixTransactions: PixTransaction[];
  settings: AppSettings;
};