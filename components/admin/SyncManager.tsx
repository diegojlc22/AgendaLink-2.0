import React from 'react';
import { useAppContext } from '../../App';
import { AppState, Client } from '../../types';
import { DownloadIcon, UploadIcon, TrashIcon } from '../common/Icons';
// FIX: Import INITIAL_APP_STATE to be used in the reset function.
import { INITIAL_APP_STATE } from '../../constants';

const SyncManager: React.FC = () => {
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
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Sincronização e Backups</h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-3 text-secondary">Sincronização Automática em Tempo Real</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    Sua aplicação agora está conectada a um servidor central, permitindo a <strong className="font-semibold">sincronização de dados em tempo real</strong> entre todos os seus dispositivos.
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Qualquer alteração feita em um dispositivo (seja no seu computador ou celular) será <strong className="font-semibold">automaticamente refletida</strong> nos outros, desde que estejam conectados à internet. O status da conexão é exibido na barra lateral.
                </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                 <h3 className="text-xl font-bold mb-4 text-secondary">Backup e Restauração Manual</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Para uma camada extra de segurança, você pode criar e restaurar backups manuais de todos os dados do seu negócio.
                </p>
                 <ol className="list-decimal list-inside space-y-4 text-gray-700 dark:text-gray-200">
                    <li>
                        <span className="font-semibold">Para criar um backup:</span>
                        <p className="pl-6 text-sm text-gray-600 dark:text-gray-400">Clique em <strong className="text-primary">"Exportar Dados"</strong>. Um arquivo de backup (`.json`) com todos os dados atuais será salvo no seu dispositivo. Guarde-o em um local seguro.</p>
                    </li>
                    <li>
                        <span className="font-semibold">Para restaurar um backup:</span>
                        <p className="pl-6 text-sm text-gray-600 dark:text-gray-400">Clique em <strong className="text-primary">"Importar Dados"</strong> e selecione o arquivo de backup. <strong className='text-red-500'>Atenção:</strong> isso substituirá todos os dados existentes no sistema.</p>
                    </li>
                 </ol>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-secondary">Ferramentas de Backup</h3>
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
        </div>
    );
};

export default SyncManager;