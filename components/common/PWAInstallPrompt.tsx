
import React from 'react';
import { DownloadIcon } from './Icons';

interface PWAInstallPromptProps {
  onInstall: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall }) => {
  return (
    <div className="fixed bottom-24 right-4 z-50 animate-bounce">
      <button
        onClick={onInstall}
        className="flex items-center space-x-2 bg-accent text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-yellow-400 transition-all hover:scale-105"
        aria-label="Instalar Aplicativo"
      >
        <DownloadIcon className="h-5 w-5" />
        <span className="font-semibold text-sm">Instalar App</span>
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
