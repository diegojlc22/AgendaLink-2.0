
import React from 'react';
import { useAppContext } from '../../App';
import { AppState, BrandingSettings } from '../../types';

const BrandingSettingsEditor: React.FC = () => {
    const { state, setState } = useAppContext();
    const { branding } = state.settings;

    const handleBrandingChange = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
        setState(prev => ({
            ...prev,
            settings: { ...prev.settings, branding: { ...prev.settings.branding, [key]: value } }
        }));
    };

    const handleColorChange = (colorName: keyof BrandingSettings['colors'], value: string) => {
        const newColors = { ...branding.colors, [colorName]: value };
        handleBrandingChange('colors', newColors);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Branding</h3>
            <div>
                <label>Nome do App</label>
                <input value={branding.appName} onChange={(e) => handleBrandingChange('appName', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700" />
            </div>
            <div>
                <label>URL do Logo</label>
                <input value={branding.logoUrl} onChange={(e) => handleBrandingChange('logoUrl', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700" />
            </div>
            <div className="flex gap-4">
                <div>
                    <label>Cor Primária</label>
                    <input type="color" value={branding.colors.primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-10 p-1 border rounded" />
                </div>
                 <div>
                    <label>Cor Secundária</label>
                    <input type="color" value={branding.colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-10 p-1 border rounded" />
                </div>
                 <div>
                    <label>Cor de Destaque</label>
                    <input type="color" value={branding.colors.accent} onChange={e => handleColorChange('accent', e.target.value)} className="w-full h-10 p-1 border rounded" />
                </div>
            </div>
        </div>
    );
};

const PixSettingsEditor: React.FC = () => {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Configuração PIX (Simulação)</h3>
            <p className="text-sm text-gray-500">Insira credenciais falsas para fins de demonstração.</p>
            <input placeholder="API Key" className="w-full p-2 border rounded dark:bg-gray-700" />
            <input placeholder="API Secret" className="w-full p-2 border rounded dark:bg-gray-700" />
        </div>
    );
};

const BackupManager: React.FC = () => {
    const { state, setState } = useAppContext();

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `agendalink-backup-${new Date().toISOString()}.json`;
        link.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedState = JSON.parse(event.target?.result as string) as AppState;
                    // Some validation could be added here
                    setState(importedState);
                    alert('Backup importado com sucesso!');
                } catch (err) {
                    alert('Erro ao importar o arquivo de backup.');
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Backup e Restauração</h3>
            <div className="flex gap-4">
                <button onClick={handleExport} className="btn-secondary text-white font-bold py-2 px-4 rounded">Exportar Dados (JSON)</button>
                <label className="btn-primary text-white font-bold py-2 px-4 rounded cursor-pointer">
                    Importar Dados (JSON)
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
            </div>
        </div>
    );
};

const MaintenanceModeManager: React.FC = () => {
    const { state, setState } = useAppContext();
    const { maintenanceMode } = state.settings;

    const toggleMaintenance = () => {
        setState(prev => ({
            ...prev,
            settings: { ...prev.settings, maintenanceMode: { ...prev.settings.maintenanceMode, enabled: !maintenanceMode.enabled } }
        }));
    };
    
    const handleMessageChange = (message: string) => {
        setState(prev => ({
            ...prev,
            settings: { ...prev.settings, maintenanceMode: { ...prev.settings.maintenanceMode, message } }
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Modo Manutenção</h3>
            <div className="flex items-center space-x-4">
                <label className="font-semibold">Ativar Modo Manutenção:</label>
                <button onClick={toggleMaintenance} className={`px-4 py-2 rounded font-bold ${maintenanceMode.enabled ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {maintenanceMode.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
            {maintenanceMode.enabled && (
                <div>
                    <label>Mensagem de Manutenção</label>
                    <input value={maintenanceMode.message} onChange={e => handleMessageChange(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700" />
                </div>
            )}
        </div>
    );
};


const SettingsManager: React.FC = () => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configurações</h2>
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <BrandingSettingsEditor />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <PixSettingsEditor />
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <MaintenanceModeManager />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <BackupManager />
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;
