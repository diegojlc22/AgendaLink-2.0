import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../App';
import { Service, AppointmentStatus, Promotion } from '../../types';
import { ClockIcon } from '../common/Icons';
import { generateBRCode } from '../../utils/pix';

interface BookingCalendarProps {
  service: Service;
  onBack: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ service, onBack }) => {
  const { state, setState, currentUser } = useAppContext();
  const { appName } = state.settings.branding;
  const { pixKey, pixKeyType } = state.settings.pixCredentials;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Local'>('Local');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

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

  const handleApplyPromo = () => {
    setPromoMessage({ type: '', text: '' });
    setDiscount(0);
    setAppliedPromo(null);

    const promo = state.promotions.find(p => p.promoCode?.toLowerCase() === promoCode.toLowerCase());
    
    if (!promo) {
        setPromoMessage({ type: 'error', text: 'Código inválido.' });
        return;
    }
    if (!promo.isActive) {
        setPromoMessage({ type: 'error', text: 'Esta promoção não está ativa.' });
        return;
    }
    const now = new Date();
    if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
        setPromoMessage({ type: 'error', text: 'Promoção fora do período de validade.' });
        return;
    }
    if (promo.usageLimit && promo.uses >= promo.usageLimit) {
        setPromoMessage({ type: 'error', text: 'Limite de usos da promoção atingido.' });
        return;
    }
    if (!promo.serviceIds.includes(service.id)) {
        setPromoMessage({ type: 'error', text: 'Este código não é válido para o serviço selecionado.' });
        return;
    }

    let calculatedDiscount = 0;
    if (promo.type === 'percentage') {
        calculatedDiscount = service.price * (promo.value / 100);
    } else { // fixed
        calculatedDiscount = promo.value;
    }
    
    setDiscount(calculatedDiscount);
    setAppliedPromo(promo);
    setPromoMessage({ type: 'success', text: `Desconto de R$ ${calculatedDiscount.toFixed(2)} aplicado!` });
  };

  const handleBooking = () => {
    if (!selectedSlot || !currentUser) {
        alert("Erro: Usuário não encontrado.");
        return;
    };
    
    const finalPrice = service.price - discount;

    const newAppointment = {
      id: new Date().toISOString(),
      serviceId: service.id,
      clientId: currentUser.id,
      startTime: selectedSlot.toISOString(),
      endTime: new Date(selectedSlot.getTime() + service.duration * 60000).toISOString(),
      status: AppointmentStatus.Pending,
      paymentMethod,
      paymentConfirmed: false, // payment is confirmed by admin for both methods
      appliedPromoId: appliedPromo?.id,
      finalPrice: finalPrice,
    };

    setState(prev => {
        const newAppointments = [...prev.appointments, newAppointment];
        const newPromotions = appliedPromo ? prev.promotions.map(p => 
            p.id === appliedPromo.id ? { ...p, uses: p.uses + 1 } : p
        ) : prev.promotions;

        return {
          ...prev,
          appointments: newAppointments,
          promotions: newPromotions,
        }
    });

    alert('Agendamento solicitado com sucesso! Aguarde a confirmação.');
    onBack();
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const finalPrice = service.price - discount;

  const getCleanPixKey = () => {
      if (!pixKey || !pixKeyType) return '';
      if (pixKeyType === 'celular') {
          return `+55${pixKey.replace(/\D/g, '')}`;
      }
      if (pixKeyType === 'cpf') {
          return pixKey.replace(/\D/g, '');
      }
      return pixKey;
  }

  const brCode = (pixKeyType && pixKey && paymentMethod === 'Pix') 
      ? generateBRCode(
          getCleanPixKey(), 
          finalPrice, 
          appName.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25), 
          'SAO PAULO'
        )
      : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl">
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
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
              className={`p-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                available
                  ? (selectedSlot?.getTime() === slot.getTime() ? 'bg-primary text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 hover:bg-primary/20 dark:hover:bg-primary/30')
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed line-through'
              }`}
            >
              {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          );
        })}
      </div>

      {selectedSlot && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold">Confirmar Agendamento</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Você está agendando <span className="font-semibold text-primary">{service.name}</span> para o dia <span className="font-semibold">{selectedDate.toLocaleDateString()}</span> às <span className="font-semibold">{selectedSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
          </p>
          <p className="mt-2 text-lg font-bold">Total: R$ {service.price.toFixed(2)}</p>

          <div className="mt-4">
              <label htmlFor="promo-code" className="block text-sm font-medium">Código Promocional</label>
              <div className="flex gap-2 mt-1">
                  <input
                      type="text"
                      id="promo-code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="flex-grow p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  />
                  <button onClick={handleApplyPromo} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg">Aplicar</button>
              </div>
              {promoMessage.text && <p className={`text-sm mt-2 ${promoMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{promoMessage.text}</p>}
          </div>

          {discount > 0 && (
            <p className="mt-2 text-xl font-bold text-green-600">
                Novo Total: R$ {finalPrice.toFixed(2)}
            </p>
          )}

          <div className="mt-4">
              <h4 className="font-semibold mb-2">Forma de Pagamento</h4>
              <div className="flex gap-4">
                  <button onClick={() => setPaymentMethod('Local')} className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'Local' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'}`}>Pagar no Local</button>
                  <button onClick={() => setPaymentMethod('Pix')} className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'Pix' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'}`}>PIX Online</button>
              </div>
          </div>

          {paymentMethod === 'Pix' && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  {brCode ? (
                      <>
                          <p className="font-semibold mb-2">Pague com PIX para iniciar a confirmação</p>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(brCode)}`} alt="QR Code PIX" className="mx-auto rounded-lg" />
                          <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">Aponte a câmera do seu celular para o QR Code.</p>
                          <div className="mt-4">
                              <label className="text-sm font-semibold">PIX Copia e Cola:</label>
                              <textarea
                                  readOnly
                                  value={brCode}
                                  className="w-full p-2 mt-1 text-xs bg-white dark:bg-gray-800 border rounded-lg"
                                  rows={3}
                                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                              />
                              <button
                                  onClick={() => {
                                      navigator.clipboard.writeText(brCode);
                                      alert('Código PIX copiado!');
                                  }}
                                  className="mt-2 text-sm btn-secondary text-white font-bold py-1 px-3 rounded-lg"
                              >
                                  Copiar Código
                              </button>
                          </div>
                          <p className="text-xs mt-4 text-gray-500 dark:text-gray-400">Após o pagamento, seu agendamento será confirmado pelo administrador.</p>
                      </>
                  ) : (
                      <p className="text-red-500 font-semibold">A chave PIX não foi configurada pelo administrador. Não é possível continuar.</p>
                  )}
              </div>
          )}

          <button
            onClick={handleBooking}
            disabled={paymentMethod === 'Pix' && !brCode}
            className="w-full mt-6 btn-primary text-white font-bold py-3 px-4 rounded-lg text-lg disabled:bg-gray-400"
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;