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
  AwaitingConfirmation = 'Aguardando confirmação',
  PaymentNotIdentified = 'Pagamento não identificado',
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
  logoEnabled: boolean;
  colors: {
    primary: string; // hex
    secondary: string; // hex
    accent: string; // hex
  };
}

export type PixKeyType = 'cpf' | 'celular' | 'email' | 'aleatoria' | '';

export interface AppSettings {
  branding: BrandingSettings;
  pixCredentials: {
    pixKeyType: PixKeyType;
    pixKey: string;
    pixExpirationTime: number;
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

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';


// Nova arquitetura de contexto para um fluxo de dados controlado
export interface AppContextType {
  state: AppState;
  currentUser: Omit<Client, 'password'> | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (newUser: Omit<Client, 'id'>) => void;
  resetPassword: (email: string) => Promise<string>; // Para usuários deslogados
  isAdminView: boolean;
  setIsAdminView: (isAdmin: boolean) => void;

  // Métodos específicos para modificar o estado, substituindo o setState genérico
  addOrUpdateService: (service: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  addOrUpdatePromotion: (promotion: Promotion) => Promise<void>;
  deletePromotion: (promotionId: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, paymentConfirmed?: boolean) => Promise<void>;
  createAppointment: (appointmentData: Appointment) => Promise<void>;
  updateClientNotes: (clientId: string, notes: string) => Promise<void>;
  resetClientPassword: (clientId: string) => Promise<string>; // Para o painel de admin
  
  updateBrandingSettings: (branding: BrandingSettings) => Promise<void>;
  updatePixSettings: (pix: AppSettings['pixCredentials']) => Promise<void>;
  updateMaintenanceMode: (maintenance: AppSettings['maintenanceMode']) => Promise<void>;

  dangerouslyReplaceState: (newState: AppState) => Promise<void>; // Para importação de dados

  syncState: SyncState;
  forceSync: () => Promise<void>;

  isTestMode: boolean;
  toggleTestMode: () => Promise<void>;
}