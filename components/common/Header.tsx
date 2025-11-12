
import React from 'react';
import { useAppContext } from '../../App';

const Header: React.FC = () => {
    const { state } = useAppContext();
    const { appName, logoUrl } = state.settings.branding;

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img src={logoUrl} alt="Logo" className="h-10 w-10"/>
                    <h1 className="text-2xl font-bold text-primary">{appName}</h1>
                </div>
                {/* Could add nav links here */}
            </div>
        </header>
    );
};

export default Header;
