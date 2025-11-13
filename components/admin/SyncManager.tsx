import React from 'react';
import { useAppContext } from '../../App';
import { AppState, Client } from '../../types';
import { DownloadIcon, UploadIcon, TrashIcon, AlertTriangleIcon } from '../common/Icons';
import { INITIAL_APP_STATE } from '../../constants';
import { resetTestEnvironment } from '../../services/mockServer';

const SyncManager: React.FC = () => {
    const { state, dangerouslyReplaceState, forceSync, isTestMode, toggleTestMode } = useAppContext();

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
                    if (window.confirm('Tem certeza que deseja importar estes dados? A ação substituirá TODOS os dados atuais e sincronizará com o servidor.')) {
                        await dangerouslyReplaceState(importedState);
                        alert('Backup importado com sucesso! Os dados foram atualizados e sincronizados.');
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
        if (window.confirm('ATENÇÃO: Esta ação é irreversível e irá apagar TODOS os dados do aplicativo, tanto localmente quanto no servidor. Deseja continuar?')) {
            const adminUser: Client = {
                id: '2', name: 'Admin', email: 'admin@admin', phone: '00000000000', password: 'admin', role: 'admin',
            };
             const resetState: AppState = {
                ...INITIAL_APP_STATE,
                clients: [adminUser],
                services: [],
                appointments: [],
                promotions: [],
                pixTransactions: [],
            };

            try {
                await dangerouslyReplaceState(resetState);
                localStorage.removeItem('agendaLinkAuthToken');

                alert('Todos os dados foram apagados. A aplicação será recarregada.');
                window.location.reload();

            } catch(error) {
                console.error("Falha ao limpar os dados:", error);
                alert("Ocorreu um erro ao tentar limpar os dados. Verifique o console para mais detalhes.");
            }
        }
    };
    
    const handleResetTestEnv = () => {
        if (window.confirm("Tem certeza que deseja resetar o ambiente de teste? Todos os dados de teste serão apagados. Da próxima vez que ativá-lo, uma nova cópia dos dados de produção será criada.")) {
            resetTestEnvironment();
            alert("Ambiente de teste resetado com sucesso.");
            if (isTestMode) {
                // Se o usuário estiver no modo de teste, força a saída para evitar inconsistências.
                toggleTestMode();
            }
        }
    };


    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Backup e Sincronização</h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-3 text-secondary">Arquitetura Híbrida (Offline + Sincronização)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    Sua aplicação agora funciona em um modelo <strong className="font-semibold">híbrido</strong> para oferecer a melhor experiência.
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300 space-y-2">
                    <li><strong className="font-semibold text-primary">Banco de Dados Local:</strong> Para velocidade máxima e funcionamento offline, todos os dados são salvos primeiro em um banco de dados no seu navegador.</li>
                    <li><strong className="font-semibold text-primary">Servidor Central:</strong> Em seguida, as alterações são enviadas para um servidor central, garantindo que seus dados estejam seguros e sincronizados entre diferentes navegadores e dispositivos.</li>
                </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl shadow-lg mb-8 border-l-4 border-blue-500">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">Ambiente de Teste</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 mb-4">
                    Ative o ambiente de teste para experimentar livremente com uma <strong className="font-semibold">cópia segura dos seus dados</strong>. Todas as alterações feitas neste modo são isoladas e <strong className="font-semibold">não afetarão seus dados reais</strong>. Perfeito para testar novas promoções ou configurações.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                    <button onClick={toggleTestMode} className={`font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${isTestMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-200 hover:bg-blue-300 text-blue-800'}`}>
                        <AlertTriangleIcon className="h-5 w-5" />
                        {isTestMode ? 'Sair do Ambiente de Teste' : 'Ativar Ambiente de Teste'}
                    </button>
                    <button onClick={handleResetTestEnv} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                        <TrashIcon className="h-5 w-5" />
                        Resetar Ambiente de Teste
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-secondary">Backup e Restauração Manual</h3>
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
                     <button onClick={forceSync} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                        <UploadIcon className="h-5 w-5" />
                        Forçar Sincronização
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-red-50 dark:bg-red-900/20 p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300">Zona de Perigo</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 mb-4">A ação abaixo é irreversível e irá apagar <strong className="font-semibold">todos os dados do aplicativo permanentemente</strong>. Use com extrema cautela.</p>
                <button onClick={handleClearData} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <TrashIcon className="h-5 w-5" />
                    Resetar Todos os Dados
                </button>
            </div>
        </div>
    );
};

export default SyncManager;