import React, { useState } from 'react';
import { useAppContext } from '../../App';
import { AppState, BrandingSettings, PixKeyType } from '../../types';

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
                <input value={branding.appName} onChange={(e) => handleBrandingChange('appName', e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900" />
            </div>
            <div>
                <label>URL do Logo</label>
                <input value={branding.logoUrl} onChange={(e) => handleBrandingChange('logoUrl', e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900" />
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
    const { state, setState } = useAppContext();
    const { pixCredentials } = state.settings;
    
    const [keyType, setKeyType] = useState<PixKeyType>(pixCredentials.pixKeyType || '');
    const [keyValue, setKeyValue] = useState(pixCredentials.pixKey || '');

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
                }
            }
        }));
        alert('Chave PIX salva com sucesso!');
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
            <p className="text-sm text-gray-500">Cadastre a chave PIX que será usada para gerar os QR Codes de pagamento.</p>
            <div>
                <label>Tipo de Chave</label>
                <select value={keyType} onChange={(e) => { setKeyType(e.target.value as PixKeyType); setKeyValue(''); }} className="w-full p-2 border rounded bg-white text-gray-900">
                    <option value="">Selecione um tipo</option>
                    <option value="cpf">CPF</option>
                    <option value="celular">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                </select>
            </div>
            {keyType && (
                <div>
                    <label>Chave PIX</label>
                    <input
                        {...getInputProps()}
                        value={keyValue}
                        onChange={handleKeyChange}
                        className="w-full p-2 border rounded bg-white text-gray-900"
                        required
                    />
                     {keyType === 'celular' && <p className="text-xs text-gray-400 mt-1">Insira o DDD + número. O formato `+55` será adicionado para o pagamento.</p>}
                </div>
            )}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={!keyType || !keyValue} className="btn-primary text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                    Salvar Chave PIX
                </button>
            </div>
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
                    <input value={maintenanceMode.message} onChange={e => handleMessageChange(e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900" />
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