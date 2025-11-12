import React from 'react';
import { useAppContext } from '../../App';
import { AppointmentStatus, Appointment } from '../../types';

const getStatusChip = (status: AppointmentStatus) => {
  switch (status) {
    case AppointmentStatus.Confirmed:
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{status}</span>;
    case AppointmentStatus.Pending:
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
    case AppointmentStatus.Cancelled:
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{status}</span>;
    case AppointmentStatus.Completed:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{status}</span>;
    default:
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
  }
};

const AppointmentHistoryItem: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const { state } = useAppContext();
    const service = state.services.find(s => s.id === appointment.serviceId);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center">
            <div>
                <p className="font-bold text-lg text-gray-800 dark:text-white">{service?.name || 'Serviço não encontrado'}</p>
                <p className="text-sm text-gray-500">{new Date(appointment.startTime).toLocaleString()}</p>
            </div>
            {getStatusChip(appointment.status)}
        </div>
    )
}

const Profile: React.FC = () => {
    const { state, logout, currentUser } = useAppContext();

    if (!currentUser) {
        return <div>Usuário não encontrado. Por favor, faça login novamente.</div>;
    }

    const client = currentUser;
    const clientAppointments = state.appointments.filter(a => a.clientId === client.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Meu Perfil</h2>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
            Sair
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold mb-4">Informações Pessoais</h3>
        <p><strong>Nome:</strong> {client.name}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Telefone:</strong> {client.phone}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold mb-4">Alterar Senha</h3>
        <form onSubmit={(e) => { e.preventDefault(); alert('Senha alterada (simulação)!'); }}>
          <div className="space-y-4">
            <input type="password" placeholder="Senha Atual" className="w-full p-2 border rounded-md dark:bg-gray-700" required />
            <input type="password" placeholder="Nova Senha" className="w-full p-2 border rounded-md dark:bg-gray-700" required />
            <input type="password" placeholder="Confirmar Nova Senha" className="w-full p-2 border rounded-md dark:bg-gray-700" required />
          </div>
          <button type="submit" className="mt-4 btn-secondary text-white font-bold py-2 px-4 rounded-lg">
            Salvar Nova Senha
          </button>
        </form>
      </div>

      <div className="p-6 rounded-lg">
        <h3 className="text-2xl font-bold mb-4">Histórico de Agendamentos</h3>
        <div className="space-y-4">
            {clientAppointments.length > 0 ? (
                clientAppointments.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(appt => <AppointmentHistoryItem key={appt.id} appointment={appt} />)
            ) : (
                <p className="text-gray-500">Você ainda não tem agendamentos.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Profile;