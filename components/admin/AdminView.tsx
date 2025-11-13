
import React, { useState, lazy, Suspense } from 'react';
import { CalendarIcon, CogIcon, DashboardIcon, TagIcon, UsersIcon, PercentageIcon, MenuIcon, XIcon } from '../common/Icons';
import { useAppContext } from '../../App';

const Dashboard = lazy(() => import('./Dashboard'));
const AppointmentManager = lazy(() => import('./AppointmentManager'));
const ServiceManager = lazy(() => import('./ServiceManager'));
const ClientManager = lazy(() => import('./ClientManager'));
const PromotionManager = lazy(() => import('./PromotionManager'));
const SettingsManager = lazy(() => import('./SettingsManager'));


type AdminSection = 'dashboard' | 'appointments' | 'services' | 'clients' | 'promotions' | 'settings';

const SECTION_TITLES: { [key in AdminSection]: string } = {
    dashboard: 'Dashboard',
    appointments: 'Agendamentos',
    services: 'Serviços',
    clients: 'Clientes',
    promotions: 'Promoções',
    settings: 'Configurações',
};

const AdminSidebar: React.FC<{
    activeSection: AdminSection;
    setActiveSection: (section: AdminSection) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}> = ({ activeSection, setActiveSection, isOpen, setIsOpen }) => {
    const { logout, state, setIsAdminView } = useAppContext();

    const NavItem: React.FC<{ section: AdminSection; label: string; icon: React.ReactNode }> = ({ section, label, icon }) => (
        <li>
            <button
                onClick={() => {
                    setActiveSection(section);
                    setIsOpen(false); // Close sidebar on mobile after navigation
                }}
                className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
                    activeSection === section ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'
                }`}
            >
                {icon}
                <span className="ml-3 font-medium">{label}</span>
            </button>
        </li>
    );
    
    return (
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white shadow-2xl flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {state.settings.branding.logoEnabled && state.settings.branding.logoUrl && <img src={state.settings.branding.logoUrl} alt="Logo" className="h-8 w-8"/>}
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="mt-6 flex-grow px-4">
                <ul className="space-y-2">
                    <NavItem section="dashboard" label="Dashboard" icon={<DashboardIcon className="h-6 w-6" />} />
                    <NavItem section="appointments" label="Agendamentos" icon={<CalendarIcon className="h-6 w-6" />} />
                    <NavItem section="services" label="Serviços" icon={<TagIcon className="h-6 w-6" />} />
                    <NavItem section="promotions" label="Promoções" icon={<PercentageIcon className="h-6 w-6" />} />
                    <NavItem section="clients" label="Clientes" icon={<UsersIcon className="h-6 w-6" />} />
                    <NavItem section="settings" label="Configurações" icon={<CogIcon className="h-6 w-6" />} />
                </ul>
            </nav>
            <div className="px-4 py-2">
                <button
                    onClick={() => setIsAdminView(false)}
                    className="flex items-center w-full p-3 space-x-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200"
                    title="Ver como Cliente"
                    aria-label="Ver como Cliente"
                >
                    <UsersIcon className="h-6 w-6" />
                    <span className="font-medium">Ver como Cliente</span>
                </button>
            </div>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={logout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Sair
                </button>
            </div>
        </aside>
    );
}


const AdminHeader: React.FC<{
    onMenuClick: () => void;
    sectionTitle: string;
}> = ({ onMenuClick, sectionTitle }) => {
    return (
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md md:hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button onClick={onMenuClick} className="text-gray-500 dark:text-gray-400 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200">
                           <MenuIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white ml-4">{sectionTitle}</h1>
                    </div>
                </div>
            </div>
        </header>
    );
};


const AdminView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard': return <Dashboard />;
            case 'appointments': return <AppointmentManager />;
            case 'services': return <ServiceManager />;
            case 'clients': return <ClientManager />;
            case 'promotions': return <PromotionManager />;
            case 'settings': return <SettingsManager />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Overlay for mobile */}
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"></div>}

            <AdminSidebar 
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader 
                    onMenuClick={() => setIsSidebarOpen(true)}
                    sectionTitle={SECTION_TITLES[activeSection]}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">Carregando...</div>}>
                        {renderSection()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default AdminView;
