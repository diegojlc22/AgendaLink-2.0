import React from 'react';

// Define the type for an appointment
interface Appointment {
  id: number;
  time_slot: string;
  user_name: string;
}

interface AppointmentGridProps {
  appointments: Appointment[];
  isAdmin: boolean;
  onBookSlot: (timeSlot: string) => void;
  onDeleteAppointment: (id: number) => void;
}

// Define the available time slots for the day
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const AppointmentGrid: React.FC<AppointmentGridProps> = ({
  appointments,
  isAdmin,
  onBookSlot,
  onDeleteAppointment
}) => {
  // Create a map for quick lookup of appointments by time slot
  const appointmentsMap = new Map(appointments.map(appt => [appt.time_slot, appt]));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {TIME_SLOTS.map(slot => {
        const appointment = appointmentsMap.get(slot);
        const isBooked = !!appointment;

        if (isBooked) {
          return (
            <div key={slot} className="relative bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 flex flex-col justify-center items-center text-center">
              <p className="font-bold text-xl text-white">{slot}</p>
              <p className="text-sm text-slate-400 mt-2">Reservado por:</p>
              <p className="font-semibold text-pink-400">{appointment.user_name}</p>
              {isAdmin && (
                <button
                  onClick={() => onDeleteAppointment(appointment.id)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-500 transition-transform transform hover:scale-110"
                  aria-label="Remover agendamento"
                >
                  X
                </button>
              )}
            </div>
          );
        } else {
          return (
            <button
              key={slot}
              onClick={() => onBookSlot(slot)}
              className="bg-slate-700 p-4 rounded-lg shadow-lg border border-transparent hover:border-pink-500 hover:bg-slate-600 transition-all duration-200 flex flex-col justify-center items-center text-center group"
            >
              <p className="font-bold text-xl text-white">{slot}</p>
              <p className="text-sm font-semibold text-green-400 mt-2 transition-opacity opacity-0 group-hover:opacity-100 duration-300">
                Agendar
              </p>
            </button>
          );
        }
      })}
    </div>
  );
};

export default AppointmentGrid;
