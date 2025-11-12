import React, { useMemo } from 'react';
import { useAppContext } from '../../App';
import { AppointmentStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-t-4 ${color}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
    const { state } = useAppContext();
    const { appointments, clients, services } = state;

    const totalRevenue = useMemo(() => 
        appointments
            .filter(a => a.status === AppointmentStatus.Completed)
            .reduce((sum, a) => sum + a.finalPrice, 0)
    , [appointments]);

    const pendingAppointments = useMemo(() => 
        appointments.filter(a => a.status === AppointmentStatus.Pending).length
    , [appointments]);
    
    const servicePopularity = useMemo(() => {
        const counts: { [key: string]: number } = {};
        appointments.forEach(a => {
            if (a.status === AppointmentStatus.Completed) {
                const service = services.find(s => s.id === a.serviceId);
                if (service) {
                    counts[service.name] = (counts[service.name] || 0) + 1;
                }
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [appointments, services]);

    const monthlyRevenue = useMemo(() => {
        const data: { [key: string]: number } = {};
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        appointments.forEach(a => {
            if (a.status === AppointmentStatus.Completed) {
                const date = new Date(a.startTime);
                const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                data[monthKey] = (data[monthKey] || 0) + a.finalPrice;
            }
        });
        return Object.entries(data).map(([name, revenue]) => ({ name, revenue }));

    }, [appointments]);


    const PIE_COLORS = ['#d81b60', '#8e24aa', '#ffb300', '#22c55e', '#3b82f6'];

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Receita Total" value={`R$ ${totalRevenue.toFixed(2)}`} color="border-primary" />
                <StatCard title="Novos Clientes" value={clients.length.toString()} color="border-secondary" />
                <StatCard title="Agendamentos Pendentes" value={pendingAppointments.toString()} color="border-accent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Receita Mensal</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip wrapperClassName="!bg-white dark:!bg-gray-700 !border-gray-300 dark:!border-gray-600 !rounded-lg" />
                            <Legend />
                            <Bar dataKey="revenue" fill="rgb(var(--color-primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">Serviços Populares</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={servicePopularity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {servicePopularity.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip wrapperClassName="!bg-white dark:!bg-gray-700 !border-gray-300 dark:!border-gray-600 !rounded-lg" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;