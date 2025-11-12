
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../App';
import { Service, AppointmentStatus } from '../../types';
import { ClockIcon } from '../common/Icons';

interface BookingCalendarProps {
  service: Service;
  onBack: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ service, onBack }) => {
  const { state, setState } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Local'>('Local');

  const timeSlots = useMemo(() => {
    const slots = [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(9, 0, 0, 0); // Salon opens at 9:00
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(18, 0, 0, 0); // Salon closes at 18:00

    for (let time = dayStart; time < dayEnd; time.setMinutes(time.getMinutes() + 30)) {
      slots.push(new Date(time));
    }
    return slots;
  }, [selectedDate]);

  const isSlotAvailable = (slot: Date): boolean => {
    const slotEnd = new Date(slot.getTime() + service.duration * 60000);
    
    // Check for past slots
    if(slot < new Date()) return false;
    
    return !state.appointments.some(appt => {
      const apptStart = new Date(appt.startTime);
      const apptEnd = new Date(appt.endTime);
      return (
        (slot >= apptStart && slot < apptEnd) ||
        (slotEnd > apptStart && slotEnd <= apptEnd) ||
        (apptStart >= slot && apptEnd <= slotEnd)
      ) && appt.status !== AppointmentStatus.Cancelled;
    });
  };

  const handleBooking = () => {
    if (!selectedSlot) return;

    const newAppointment = {
      id: new Date().toISOString(),
      serviceId: service.id,
      clientId: '1', // Mock client ID
      startTime: selectedSlot.toISOString(),
      endTime: new Date(selectedSlot.getTime() + service.duration * 60000).toISOString(),
      status: AppointmentStatus.Pending,
      paymentMethod,
      paymentConfirmed: paymentMethod === 'Local', // Auto-confirm local payments for demo
    };

    setState(prev => ({
      ...prev,
      appointments: [...prev.appointments, newAppointment],
    }));

    alert('Agendamento solicitado com sucesso!');
    onBack();
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-primary hover:underline">
          &larr; Voltar
        </button>
        <h2 className="text-2xl font-bold text-center">{service.name}</h2>
        <div/>
      </div>

      <div className="mb-6">
          <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione uma data:</label>
          <input
              type="date"
              id="date-picker"
              min={today.toISOString().split('T')[0]}
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
          />
      </div>

      <h3 className="text-lg font-semibold mb-4">Horários disponíveis para {selectedDate.toLocaleDateString()}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {timeSlots.map((slot, index) => {
          const available = isSlotAvailable(slot);
          return (
            <button
              key={index}
              disabled={!available}
              onClick={() => setSelectedSlot(slot)}
              className={`p-3 text-sm font-semibold rounded-lg transition-colors ${
                available
                  ? (selectedSlot?.getTime() === slot.getTime() ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-primary hover:text-white')
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed line-through'
              }`}
            >
              {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          );
        })}
      </div>

      {selectedSlot && (
        <div className="mt-8 p-6 border-t-2 border-primary-light dark:border-gray-700">
          <h3 className="text-xl font-bold">Confirmar Agendamento</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Você está agendando <span className="font-semibold text-primary">{service.name}</span> para o dia <span className="font-semibold">{selectedDate.toLocaleDateString()}</span> às <span className="font-semibold">{selectedSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
          </p>
          <p className="mt-2 text-lg font-bold">Total: R$ {service.price.toFixed(2)}</p>

          <div className="mt-4">
              <h4 className="font-semibold mb-2">Forma de Pagamento</h4>
              <div className="flex gap-4">
                  <button onClick={() => setPaymentMethod('Local')} className={`p-3 rounded-lg border-2 ${paymentMethod === 'Local' ? 'border-primary' : 'border-gray-300'}`}>Pagar no Local</button>
                  <button onClick={() => setPaymentMethod('Pix')} className={`p-3 rounded-lg border-2 ${paymentMethod === 'Pix' ? 'border-primary' : 'border-gray-300'}`}>PIX Online</button>
              </div>
          </div>

          {paymentMethod === 'Pix' && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  <p className="font-semibold mb-2">Pague com PIX para confirmar</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=agendalink-pix-${new Date().getTime()}`} alt="QR Code PIX" className="mx-auto" />
                  <p className="text-xs mt-2 text-gray-500">Este é um QR code de demonstração.</p>
              </div>
          )}

          <button
            onClick={handleBooking}
            className="w-full mt-6 btn-primary text-white font-bold py-3 px-4 rounded-lg text-lg"
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
