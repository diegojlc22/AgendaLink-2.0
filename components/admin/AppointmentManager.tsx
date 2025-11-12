
import React from 'react';
import { useAppContext } from '../../App';
import { Appointment, AppointmentStatus } from '../../types';
import { CheckCircleIcon, XCircleIcon } from '../common/Icons';

const AppointmentManager: React.FC = () => {
    const { state, setState } = useAppContext();
    const { appointments, services, clients } = state;

    const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
        setState(prev => ({
            ...prev,
            appointments: prev.appointments.map(appt => 
                appt.id === id ? { ...appt, status: newStatus } : appt
            ),
        }));
    };

    const sortedAppointments = [...appointments].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gerenciar Agendamentos</h2>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Serviço</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Data & Hora</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.map(appt => {
                            const client = clients.find(c => c.id === appt.clientId);
                            const service = services.find(s => s.id === appt.serviceId);
                            return (
                                <tr key={appt.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-5 py-5 bg-white dark:bg-gray-800 text-sm">{client?.name}</td>
                                    <td className="px-5 py-5 bg-white dark:bg-gray-800 text-sm">{service?.name}</td>
                                    <td className="px-5 py-5 bg-white dark:bg-gray-800 text-sm">{new Date(appt.startTime).toLocaleString()}</td>
                                    <td className="px-5 py-5 bg-white dark:bg-gray-800 text-sm">{appt.status}</td>
                                    <td className="px-5 py-5 bg-white dark:bg-gray-800 text-sm">
                                        {appt.status === AppointmentStatus.Pending && (
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.Confirmed)} className="text-green-600 hover:text-green-900"><CheckCircleIcon className="w-6 h-6"/></button>
                                                <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.Cancelled)} className="text-red-600 hover:text-red-900"><XCircleIcon className="w-6 h-6"/></button>
                                            </div>
                                        )}
                                         {appt.status === AppointmentStatus.Confirmed && (
                                            <div className="flex space-x-2">
                                                 <button onClick={() => handleStatusChange(appt.id, AppointmentStatus.Completed)} className="text-blue-600 hover:text-blue-900 text-xs font-bold">Finalizar</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AppointmentManager;
