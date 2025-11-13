import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AppointmentGrid from './components/AppointmentGrid';

// Define the type for an appointment
interface Appointment {
  id: number;
  time_slot: string;
  user_name: string;
}

// Connect to the backend server
const socket = io('http://localhost:3001');

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // --- Socket Event Listeners ---
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server!');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server.');
    });

    // This event receives the updated list of appointments from the server
    socket.on('appointments-update', (updatedAppointments: Appointment[]) => {
      console.log('Received appointments-update:', updatedAppointments);
      setAppointments(updatedAppointments);
    });

    // Listen for error messages from the server
    socket.on('error-message', (data: { message: string }) => {
      alert(`Erro: ${data.message}`);
    });

    // --- Cleanup function ---
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('appointments-update');
      socket.off('error-message');
    };
  }, []);

  const handleBookSlot = (timeSlot: string) => {
    const userName = prompt('Digite seu nome para agendar:');
    if (userName && userName.trim() !== '') {
      socket.emit('create-appointment', { timeSlot, userName });
    }
  };

  const handleDeleteAppointment = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
      socket.emit('delete-appointment', { id });
    }
  };
  
  const ConnectionStatusIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
        <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        <span>{isConnected ? 'Conectado em tempo real' : 'Desconectado'}</span>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">🗓️ Agenda Colaborativa</h1>
          <p className="text-slate-400 mt-2">Os horários são atualizados para todos em tempo real.</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-3">
            <ConnectionStatusIndicator />
            <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg">
                <span className="text-sm font-medium">Modo Admin</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isAdmin} onChange={() => setIsAdmin(!isAdmin)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
            </div>
        </div>
      </header>

      <main>
        <AppointmentGrid
          appointments={appointments}
          onBookSlot={handleBookSlot}
          onDeleteAppointment={handleDeleteAppointment}
          isAdmin={isAdmin}
        />
      </main>
       <footer className="text-center mt-12 text-slate-500 text-sm">
        <p>Construído com Node.js, SQLite, React e Socket.io.</p>
      </footer>
    </div>
  );
};

export default App;
