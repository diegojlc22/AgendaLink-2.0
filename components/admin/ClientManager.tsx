import React, { useState } from 'react';
import { useAppContext } from '../../App';
import { Client } from '../../types';

const ClientManager: React.FC = () => {
    const { state, setState } = useAppContext();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const handleNoteChange = (clientId: string, notes: string) => {
        setState(prev => ({
            ...prev,
            clients: prev.clients.map(c => c.id === clientId ? { ...c, notes } : c),
        }));
        // also update selectedClient if it's the one being edited
        if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient(prev => prev ? { ...prev, notes } : null);
        }
    };
    
    const generateRandomPassword = () => {
        return Math.random().toString(36).slice(-8);
    };

    const handleResetPassword = (clientId: string) => {
        const clientToUpdate = state.clients.find(c => c.id === clientId);
        if (!clientToUpdate) return;

        if (!window.confirm(`Tem certeza que deseja resetar a senha do cliente ${clientToUpdate.name}?`)) {
            return;
        }
        
        const newPassword = generateRandomPassword();
        const updatedClient = { ...clientToUpdate, password: newPassword };

        // Update the main state
        setState(prev => ({
            ...prev,
            clients: prev.clients.map(c => (c.id === clientId ? updatedClient : c)),
        }));

        // BUG FIX: Update the local state to keep the UI in sync
        setSelectedClient(updatedClient);

        alert(`Senha resetada com sucesso!\n\nNova senha para ${updatedClient.name}: ${newPassword}\n\nPor favor, informe ao cliente.`);
    };

    const clientAppointments = selectedClient ? state.appointments.filter(a => a.clientId === selectedClient.id) : [];

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Clientes</h2>
                <div className="space-y-2">
                    {state.clients.map(client => (
                        <button 
                            key={client.id} 
                            onClick={() => setSelectedClient(client)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedClient?.id === client.id ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-xs">{client.role}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:w-2/3">
                {selectedClient ? (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold">{selectedClient.name}</h3>
                            <button onClick={() => handleResetPassword(selectedClient.id)} className="btn-secondary text-white text-sm font-bold py-1 px-3 rounded-lg">Resetar Senha</button>
                        </div>

                        <p><strong>Email:</strong> {selectedClient.email}</p>
                        <p><strong>Telefone:</strong> {selectedClient.phone}</p>
                        
                        <div className="mt-6">
                            <label className="font-bold">Anotações Privadas:</label>
                            <textarea
                                value={selectedClient.notes || ''}
                                onChange={(e) => handleNoteChange(selectedClient.id, e.target.value)}
                                rows={4}
                                className="w-full p-2 border rounded-lg mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Adicione notas sobre o cliente..."
                            />
                        </div>

                        <div className="mt-6">
                            <h4 className="font-bold mb-2">Histórico de Agendamentos:</h4>
                            <ul className="space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                {clientAppointments.length > 0 ? clientAppointments.map(appt => {
                                    const service = state.services.find(s => s.id === appt.serviceId);
                                    return (
                                        <li key={appt.id} className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                                            {service?.name} em {new Date(appt.startTime).toLocaleDateString()} - <span className="font-semibold">{appt.status}</span> (R$ {appt.finalPrice.toFixed(2)})
                                        </li>
                                    )
                                }) : <p className="text-sm text-gray-500 p-2">Nenhum agendamento encontrado.</p>}
                            </ul>
                        </div>

                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                        <p className="text-gray-500">Selecione um cliente para ver os detalhes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientManager;