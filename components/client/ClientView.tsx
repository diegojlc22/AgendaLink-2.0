

import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import ServiceCatalog from './ServiceCatalog';
import Promotions from './Promotions';
import Profile from './Profile';
import { CalendarIcon, TagIcon, UsersIcon } from '../common/Icons';

type Tab = 'services' | 'promotions' | 'profile';

const ClientView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('services');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'profile' || hash === 'promotions' || hash === 'services') {
        setActiveTab(hash as Tab);
      } else {
        setActiveTab('services');
      }
    };
    
    window.addEventListener('hashchange', handleHashChange, false);
    handleHashChange(); // check hash on initial load

    return () => window.removeEventListener('hashchange', handleHashChange, false);
  }, []);


  const renderContent = () => {
    switch (activeTab) {
      case 'services':
        return <ServiceCatalog />;
      case 'promotions':
        return <Promotions />;
      case 'profile':
        return <Profile />;
      default:
        return <ServiceCatalog />;
    }
  };

  const TabButton: React.FC<{ tabName: Tab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => {
        setActiveTab(tabName);
        window.location.hash = tabName;
      }}
      className={`flex-1 flex flex-col items-center justify-center p-2 text-sm transition-colors duration-200 ${
        activeTab === tabName ? 'text-primary border-t-2 border-primary' : 'text-gray-500'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 pb-20">
        {renderContent()}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-t border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-around">
          <TabButton tabName="services" label="Serviços" icon={<TagIcon className="h-6 w-6 mb-1"/>} />
          <TabButton tabName="promotions" label="Promoções" icon={<CalendarIcon className="h-6 w-6 mb-1"/>} />
          <TabButton tabName="profile" label="Perfil" icon={<UsersIcon className="h-6 w-6 mb-1"/>} />
        </div>
      </footer>
    </div>
  );
};

export default ClientView;