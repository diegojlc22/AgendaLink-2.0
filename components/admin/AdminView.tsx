import React, { useState } from 'react';
import { CalendarIcon, CogIcon, DashboardIcon, TagIcon, UsersIcon, PercentageIcon } from '../common/Icons';
import Dashboard from './Dashboard';
import AppointmentManager from './AppointmentManager';
import ServiceManager from './ServiceManager';
import ClientManager from './ClientManager';
import SettingsManager from './SettingsManager';
import { useAppContext } from '../../App';
import PromotionManager from './PromotionManager';

type AdminSection = 'dashboard' | 'appointments' | 'services' | 'clients' | 'promotions' | 'settings';

const AdminView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
    const { logout, state } = useAppContext();

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

    const NavItem: React.FC<{ section: AdminSection; label: string; icon: React.ReactNode }> = ({ section, label, icon }) => (
        <li>
            <button
                onClick={() => setActiveSection(section)}
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
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <aside className="w-64 bg-gray-800 text-white shadow-2xl flex-shrink-0 flex flex-col">
                <div className="p-5 border-b border-gray-700 flex items-center space-x-2">
                    {state.settings.branding.logoEnabled && state.settings.branding.logoUrl && <img src={state.settings.branding.logoUrl} alt="Logo" className="h-8 w-8"/>}
                    <h1 className="text-xl font-bold">Admin Panel</h1>
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
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={logout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Sair
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-8">
                {renderSection()}
            </main>
        </div>
    );
};

export default AdminView;