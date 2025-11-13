import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { AppState, BrandingSettings, PixKeyType, Client, AppSettings } from '../../types';
import { DownloadIcon, UploadIcon, TrashIcon } from '../common/Icons';
import { INITIAL_APP_STATE } from '../../constants';

const BrandingSettingsEditor: React.FC = () => {
    const { state, updateBrandingSettings } = useAppContext();
    const [draft, setDraft] = useState<BrandingSettings>(state.settings.branding);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setDraft(state.settings.branding);
        setIsDirty(false);
    }, [state.settings.branding]);

    const handleChange = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
        setDraft(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleColorChange = (colorName: keyof BrandingSettings['colors'], value: string) => {
        setDraft(prev => ({
            ...prev,
            colors: { ...prev.colors, [colorName]: value }
        }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateBrandingSettings(draft);
        setIsDirty(false);
        alert('Configurações de branding salvas com sucesso!');
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Branding</h3>
            <div>
                <label className="font-medium text-sm">Nome do App</label>
                <input value={draft.appName} onChange={(e) => handleChange('appName', e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="flex items-center space-x-3 pt-2">
                <input
                    type="checkbox"
                    id="logoEnabled"
                    name="logoEnabled"
                    checked={draft.logoEnabled}
                    onChange={(e) => handleChange('logoEnabled', e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="logoEnabled" className="font-medium text-sm">Ativar Logo</label>
            </div>
            <div>
                <label className="font-medium text-sm">URL do Logo</label>
                <input
                    value={draft.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                    disabled={!draft.logoEnabled}
                />
            </div>
            <div className="flex gap-4">
                <div>
                    <label className="font-medium text-sm">Cor Primária</label>
                    <input type="color" value={draft.colors.primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
                <div>
                    <label className="font-medium text-sm">Cor Secundária</label>
                    <input type="color" value={draft.colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
                <div>
                    <label className="font-medium text-sm">Cor de Destaque</label>
                    <input type="color" value={draft.colors.accent} onChange={e => handleColorChange('accent', e.target.value)} className="w-full h-10 p-1 border rounded-lg" />
                </div>
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={handleSave} disabled={!isDirty} className="btn-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

const PixSettingsEditor: React.FC = () => {
    const { state, updatePixSettings } = useAppContext();
    const { pixCredentials } = state.settings;
    
    const [draft, setDraft] = useState(pixCredentials);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setDraft(state.settings.pixCredentials);
        setIsDirty(false);
    }, [state.settings.pixCredentials]);

    const handleChange = (update: Partial<AppSettings['pixCredentials']>) => {
        setDraft(prev => ({ ...prev, ...update }));
        setIsDirty(true);
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (draft.pixKeyType === 'cpf') {
            value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
        } else if (draft.pixKeyType === 'celular') {
            value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) ').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
        }
        handleChange({ pixKey: value });
    };

    const handleSave = () => {
        updatePixSettings(draft);
        setIsDirty(false);
        alert('Configurações PIX salvas com sucesso!');
    };
    
    const getInputProps = () => {
        switch(draft.pixKeyType) {
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
                <select value={draft.pixKeyType} onChange={(e) => handleChange({ pixKeyType: e.target.value as PixKeyType, pixKey: '' })} className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white">
                    <option value="">Selecione um tipo</option>
                    <option value="cpf">CPF</option>
                    <option value="celular">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                </select>
            </div>
            {draft.pixKeyType && (
                <div>
                    <label className="font-medium text-sm">Chave PIX</label>
                    <input
                        {...getInputProps()}
                        value={draft.pixKey}
                        onChange={handleKeyChange}
                        className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                        required
                    />
                     {draft.pixKeyType === 'celular' && <p className="text-xs text-gray-400 mt-1">Insira o DDD + número. O formato `+55` será adicionado para o pagamento.</p>}
                </div>
            )}
            <div>
                <label className="font-medium text-sm">Tempo de Expiração do PIX (segundos)</label>
                <input
                    type="number"
                    value={draft.pixExpirationTime}
                    onChange={e => handleChange({ pixExpirationTime: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                    placeholder="60"
                />
                <p className="text-xs text-gray-400 mt-1">Tempo em segundos que o cliente terá para pagar o QR Code. Padrão: 60.</p>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={!isDirty || !draft.pixKeyType || !draft.pixKey} className="btn-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                    Salvar Configurações PIX
                </button>
            </div>
        </div>
    );
};

const MaintenanceModeManager: React.FC = () => {
    const { state, updateMaintenanceMode } = useAppContext();
    const { maintenanceMode } = state.settings;

    const [draft, setDraft] = useState(maintenanceMode);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setDraft(maintenanceMode);
        setIsDirty(false);
    }, [maintenanceMode]);

    const handleChange = (update: Partial<AppSettings['maintenanceMode']>) => {
        setDraft(prev => ({ ...prev, ...update }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateMaintenanceMode(draft);
        setIsDirty(false);
        alert('Modo Manutenção atualizado com sucesso!');
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Modo Manutenção</h3>
            <div className="flex items-center space-x-3 pt-2">
                <input
                    type="checkbox"
                    id="maintenanceEnabled"
                    checked={draft.enabled}
                    onChange={(e) => handleChange({ enabled: e.target.checked })}
                    className="h-5 w-5 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="maintenanceEnabled" className="font-medium text-sm cursor-pointer">
                    Ativar Modo Manutenção
                </label>
            </div>
            <div>
                <label className="font-medium text-sm">Mensagem de Manutenção</label>
                <input
                    value={draft.message}
                    onChange={e => handleChange({ message: e.target.value })}
                    className="w-full p-2 mt-1 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                    disabled={!draft.enabled}
                />
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={handleSave} disabled={!isDirty} className="btn-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

const DataManager: React.FC = () => {
    const { state, dangerouslyReplaceState, forceSync } = useAppContext();

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
            reader.onload = async (event) => {
                try {
                    const importedState = JSON.parse(event.target?.result as string) as AppState;
                    if (window.confirm('Tem certeza que deseja importar estes dados? A ação substituirá TODOS os dados atuais no servidor e em todos os dispositivos.')) {
                        await dangerouslyReplaceState(importedState);
                        alert('Backup importado com sucesso! Os dados foram atualizados.');
                        await forceSync();
                    }
                } catch (err) {
                    alert('Erro ao importar o arquivo de backup. Verifique se o arquivo é válido.');
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    const handleClearData = async () => {
        if (window.confirm('ATENÇÃO: Esta ação é irreversível e irá apagar TODOS os dados do servidor e de todos os dispositivos. Deseja continuar?')) {
            const adminUser: Client = {
                id: '2', name: 'Admin', email: 'admin@admin', phone: '00000000000', password: 'admin', role: 'admin',
            };
             const resetState: AppState = {
                settings: INITIAL_APP_STATE.settings, // Use as configurações iniciais
                clients: [adminUser], services: [], appointments: [], promotions: [], pixTransactions: [],
            };

            try {
                await dangerouslyReplaceState(resetState);
                localStorage.removeItem('agendaLinkCurrentUser');

                alert('Todos os dados do servidor foram apagados. A aplicação será recarregada.');
                window.location.reload();

            } catch(error) {
                console.error("Falha ao limpar os dados:", error);
                alert("Ocorreu um erro ao tentar limpar os dados. Verifique o console para mais detalhes.");
            }
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                 <h3 className="text-xl font-bold mb-4">Backup e Restauração Manual</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Para uma camada extra de segurança, você pode criar e restaurar backups manuais de todos os dados do seu negócio. Use os botões abaixo para exportar os dados atuais para um arquivo ou importar dados de um backup.
                </p>
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
                </div>
            </div>

            <div className="mt-8 bg-red-50 dark:bg-red-900/20 p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300">Zona de Perigo</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 mb-4">A ação abaixo é irreversível e irá apagar <strong className="font-semibold">todos os dados do servidor permanentemente</strong>. Use com extrema cautela.</p>
                <button onClick={handleClearData} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <TrashIcon className="h-5 w-5" />
                    Resetar Servidor (Hard Reset)
                </button>
            </div>
        </>
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
                <DataManager />
            </div>
        </div>
    );
};

export default SettingsManager;