import React, { useState } from 'react';
import { useAppContext } from '../../App';
import { AppState, BrandingSettings, PixKeyType } from '../../types';
import { DownloadIcon, UploadIcon, TrashIcon } from '../common/Icons';
import { INITIAL_APP_STATE } from '../../constants';
import { saveStateToDB } from '../../services/database';

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
                <label className="font-medium text-sm">Nome do App</label>
                <input value={branding.appName} onChange={(e) => handleBrandingChange('appName', e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white" />
            </div>
             <div className="flex items-center space-x-3 pt-2">
                <input 
                    type="checkbox" 
                    id="logoEnabled" 
                    name="logoEnabled"
                    checked={branding.logoEnabled} 
                    onChange={(e) => handleBrandingChange('logoEnabled', e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="logoEnabled" className="font-medium text-sm">Ativar Logo</label>
            </div>
            <div>
                <label className="font-medium text-sm">URL do Logo</label>
                <input 
                    value={branding.logoUrl} 
                    onChange={(e) => handleBrandingChange('logoUrl', e.target.value)} 
                    className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                    disabled={!branding.logoEnabled}
                />
            </div>
            <div className="flex gap-4">
                <div>
                    <label className="font-medium text-sm">Cor Primária</label>
                    <input type="color" value={branding.colors.primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
                 <div>
                    <label className="font-medium text-sm">Cor Secundária</label>
                    <input type="color" value={branding.colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
                 <div>
                    <label className="font-medium text-sm">Cor de Destaque</label>
                    <input type="color" value={branding.colors.accent} onChange={e => handleColorChange('accent', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
            </div>
        </div>
    );
};

const PixSettingsEditor: React.FC = () => {
    const { state, setState } = useAppContext();
    const { pixCredentials } = state.settings;
    
    const [keyType, setKeyType] = useState<PixKeyType>(pixCredentials.pixKeyType || '');
    const [keyValue, setKeyValue] = useState(pixCredentials.pixKey || '');
    const [expirationTime, setExpirationTime] = useState(pixCredentials.pixExpirationTime || 60);


    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (keyType === 'cpf') {
            value = value.replace(/\D/g, '')
                         .replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                         .slice(0, 14);
        } else if (keyType === 'celular') {
            value = value.replace(/\D/g, '')
                         .replace(/^(\d{2})(\d)/g, '($1) ')
                         .replace(/(\d{5})(\d)/, '$1-$2')
                         .slice(0, 15);
        }
        setKeyValue(value);
    };

    const handleSave = () => {
        setState(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                pixCredentials: {
                    pixKeyType: keyType,
                    pixKey: keyValue,
                    pixExpirationTime: expirationTime,
                }
            }
        }));
        alert('Configurações PIX salvas com sucesso!');
    };

    const getInputProps = () => {
        switch(keyType) {
            case 'email': return { type: 'email', placeholder: 'seu.email@provedor.com' };
            case 'celular': return { type: 'tel', placeholder: '(11) 99999-9999' };
            case 'cpf': return { type: 'text', placeholder: '123.456.789-00' };
            case 'aleatoria': return { type: 'text', placeholder: 'ex: 123e4567-e89b-12d3-a456-426614174000' };
            default: return { type: 'text', placeholder: '' };
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Configuração PIX</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cadastre a chave PIX e o tempo de expiração do QR Code para pagamentos.</p>
            <div>
                <label className="font-medium text-sm">Tipo de Chave</label>
                <select value={keyType} onChange={(e) => { setKeyType(e.target.value as PixKeyType); setKeyValue(''); }} className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white">
                    <option value="">Selecione um tipo</option>
                    <option value="cpf">CPF</option>
                    <option value="celular">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                </select>
            </div>
            {keyType && (
                <div>
                    <label className="font-medium text-sm">Chave PIX</label>
                    <input
                        {...getInputProps()}
                        value={keyValue}
                        onChange={handleKeyChange}
                        className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                        required
                    />
                     {keyType === 'celular' && <p className="text-xs text-gray-400 mt-1">Insira o DDD + número. O formato `+55` será adicionado para o pagamento.</p>}
                </div>
            )}
            <div>
                <label className="font-medium text-sm">Tempo de Expiração do PIX (segundos)</label>
                <input
                    type="number"
                    value={expirationTime}
                    onChange={e => setExpirationTime(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                    placeholder="60"
                />
                <p className="text-xs text-gray-400 mt-1">Tempo em segundos que o cliente terá para pagar o QR Code. Padrão: 60.</p>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={!keyType || !keyValue} className="btn-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                    Salvar Configurações PIX
                </button>
            </div>
        </div>
    );
};

const DataManagement: React.FC = () => {
    const { state, setState } = useAppContext();

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `agendalink-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedState = JSON.parse(event.target?.result as string) as AppState;
                    if (window.confirm('Tem certeza que deseja importar estes dados? A ação substituirá todos os dados atuais.')) {
                        setState(importedState);
                        alert('Backup importado com sucesso!');
                    }
                } catch (err) {
                    alert('Erro ao importar o arquivo de backup. Verifique se o arquivo é válido.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleClearData = async () => {
        if (window.confirm('ATENÇÃO: Esta ação é irreversível e irá apagar TODOS os dados do aplicativo (agendamentos, clientes, configurações, etc.) guardados neste navegador. Deseja continuar?')) {
            const adminUser = INITIAL_APP_STATE.clients.find(c => c.role === 'admin');

            if (!adminUser) {
                alert('Erro: Usuário administrador padrão não encontrado. A operação foi cancelada.');
                return;
            }
            
            // This is the state we want after a hard reset.
            // Only the default admin and default settings. Everything else is empty.
            const resetState: AppState = {
                ...INITIAL_APP_STATE, // Use initial state as a base for settings
                services: [],
                appointments: [],
                promotions: [],
                pixTransactions: [],
                clients: [adminUser], // And only the admin client
            };

            saveStateToDB(resetState); // Overwrite database with clean state
            localStorage.removeItem('agendaLinkCurrentUser');

            if ('serviceWorker' in navigator && window.caches) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.unregister();
                }
            }

            alert('Todos os dados foram apagados. A aplicação será recarregada.');
            window.location.reload();
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Gerenciamento de Dados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Exporte seus dados para um backup, importe de um arquivo, ou limpe todos os dados do navegador.</p>
            <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                <button onClick={handleExport} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <DownloadIcon className="h-5 w-5" />
                    Exportar Dados
                </button>
                <label className="btn-primary text-white font-bold py-2 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    Importar Dados
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                 <button onClick={handleClearData} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <TrashIcon className="h-5 w-5" />
                    Limpar Todos os Dados
                </button>
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
                <button onClick={toggleMaintenance} className={`px-4 py-2 rounded-lg font-bold ${maintenanceMode.enabled ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {maintenanceMode.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
            {maintenanceMode.enabled && (
                <div>
                    <label className="font-medium text-sm">Mensagem de Manutenção</label>
                    <input value={maintenanceMode.message} onChange={e => handleMessageChange(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white" />
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <BrandingSettingsEditor />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <PixSettingsEditor />
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <MaintenanceModeManager />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <DataManagement />
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;