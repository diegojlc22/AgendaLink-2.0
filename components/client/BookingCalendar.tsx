import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../App';
import { Service, AppointmentStatus, Promotion, Appointment } from '../../types';
import { ClockIcon, CheckCircleIcon } from '../common/Icons';
import { generateBRCode } from '../../utils/pix';


interface BookingCalendarProps {
  service: Service;
  onBack: () => void;
}

type PixStatus = 'idle' | 'loading' | 'generated' | 'notified' | 'paid' | 'error';

const BookingCalendar: React.FC<BookingCalendarProps> = ({ service, onBack }) => {
  const { state, createAppointment, updateAppointmentStatus, currentUser } = useAppContext();
  const { pixKey, pixExpirationTime } = state.settings.pixCredentials;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Local'>('Local');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });
  const [bookingAttempt, setBookingAttempt] = useState(false);
  
  const [pixStatus, setPixStatus] = useState<PixStatus>('idle');
  const [pixDetails, setPixDetails] = useState<{ qrCodeUrl: string; copyPaste: string; } | null>(null);
  const [isPixExpired, setIsPixExpired] = useState(false);
  const [countdown, setCountdown] = useState(pixExpirationTime || 60);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);


  const finalPrice = service.price - discount;
  
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (pixStatus === 'generated' && !isPixExpired) {
      timerId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            setIsPixExpired(true);
            if (pendingAppointmentId) {
                updateAppointmentStatus(pendingAppointmentId, AppointmentStatus.Cancelled);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [pixStatus, isPixExpired, pendingAppointmentId, updateAppointmentStatus]);


  const timeSlots = useMemo(() => {
    const slots = [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(18, 0, 0, 0);

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
    if (!promo || !promo.isActive || new Date() < new Date(promo.startDate) || new Date() > new Date(promo.endDate) || (promo.usageLimit && promo.uses >= promo.usageLimit) || !promo.serviceIds.includes(service.id)) {
        setPromoMessage({ type: 'error', text: 'Código promocional inválido ou expirado.' });
        return;
    }

    let calculatedDiscount = promo.type === 'percentage' ? service.price * (promo.value / 100) : promo.value;
    setDiscount(calculatedDiscount);
    setAppliedPromo(promo);
    setPromoMessage({ type: 'success', text: `Desconto de R$ ${calculatedDiscount.toFixed(2)} aplicado!` });
  };
  
  const initiatePixPayment = () => {
    if (!currentUser || !selectedSlot) return;

    const validExpirationTime = (typeof pixExpirationTime === 'number' && pixExpirationTime > 0) ? pixExpirationTime : 60;

    setPixStatus('loading');
    setIsPixExpired(false);
    setCountdown(validExpirationTime);
    setPixDetails(null);
    setPendingAppointmentId(null);

    const newAppointment: Appointment = {
      id: `appt${Date.now()}`,
      serviceId: service.id,
      clientId: currentUser.id,
      startTime: selectedSlot.toISOString(),
      endTime: new Date(selectedSlot.getTime() + service.duration * 60000).toISOString(),
      status: AppointmentStatus.Pending,
      paymentMethod: 'Pix',
      paymentConfirmed: false,
      appliedPromoId: appliedPromo?.id,
      finalPrice: finalPrice,
    };
    
    setPendingAppointmentId(newAppointment.id);
    createAppointment(newAppointment);

    setTimeout(() => {
        try {
            const brCode = generateBRCode(pixKey, finalPrice, state.settings.branding.appName, "SAO PAULO", `TXID${newAppointment.id}`);
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(brCode)}`;
            setPixDetails({ qrCodeUrl, copyPaste: brCode });
            setPixStatus('generated');
        } catch (error) {
            console.error("Erro ao gerar PIX:", error);
            setPixStatus('error');
            updateAppointmentStatus(newAppointment.id, AppointmentStatus.Cancelled);
            setPendingAppointmentId(null);
        }
    }, 1000);
  };

  const handlePaymentNotified = () => {
      if (!pendingAppointmentId) return;
      updateAppointmentStatus(pendingAppointmentId, AppointmentStatus.AwaitingConfirmation);
      setPixStatus('notified');
  };

  const handleBooking = () => {
    if (!selectedSlot || !currentUser) {
        alert("Erro: Horário ou usuário inválido.");
        return;
    }
     if (paymentMethod === 'Pix' && !pixKey) {
        alert("O pagamento com PIX não foi configurado pelo administrador. Selecione 'Pagar no Local'.");
        setPaymentMethod('Local');
        return;
    }
    
    setBookingAttempt(true);

    if (paymentMethod === 'Local') {
        const appointmentData: Appointment = {
          id: new Date().toISOString(),
          serviceId: service.id,
          clientId: currentUser.id,
          startTime: selectedSlot.toISOString(),
          endTime: new Date(selectedSlot.getTime() + service.duration * 60000).toISOString(),
          status: AppointmentStatus.Confirmed,
          paymentMethod,
          paymentConfirmed: true,
          appliedPromoId: appliedPromo?.id,
          finalPrice: finalPrice,
        };
        createAppointment(appointmentData);
        alert('Agendamento confirmado com sucesso!');
        onBack();
    } else { // PIX
        initiatePixPayment();
    }
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const confirmedAppointment = state.appointments.find(a => a.id === pendingAppointmentId && a.status === AppointmentStatus.Confirmed);

  if (pixStatus !== 'idle' && confirmedAppointment) {
      return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center animate-fade-in-up">
              <CheckCircleIcon className="w-24 h-24 mx-auto text-green-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Pagamento Confirmado!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Seu agendamento para <span className="font-semibold text-primary">{service.name}</span> foi confirmado com sucesso.</p>
              <button onClick={onBack} className="mt-8 w-full btn-primary text-white font-bold py-3 px-4 rounded-lg">
                  Ver Meus Agendamentos
              </button>
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-primary hover:underline disabled:text-gray-400" disabled={bookingAttempt}>
          &larr; Voltar
        </button>
        <h2 className="text-2xl font-bold text-center">{service.name}</h2>
        <div/>
      </div>

      <div className={bookingAttempt ? 'opacity-50 pointer-events-none' : ''}>
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
      </div>

      {selectedSlot && !bookingAttempt && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold">Confirmar Agendamento</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Você está agendando <span className="font-semibold text-primary">{service.name}</span> para <span className="font-semibold">{selectedDate.toLocaleDateString()}</span> às <span className="font-semibold">{selectedSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
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

          {discount > 0 && <p className="mt-2 text-xl font-bold text-green-600">Novo Total: R$ {finalPrice.toFixed(2)}</p>}

          <div className="mt-4">
              <h4 className="font-semibold mb-2">Forma de Pagamento</h4>
              <div className="flex gap-4">
                  <button onClick={() => setPaymentMethod('Local')} className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'Local' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'}`}>Pagar no Local</button>
                  <button 
                    onClick={() => setPaymentMethod('Pix')} 
                    disabled={!pixKey}
                    title={!pixKey ? "O pagamento com PIX não foi configurado pelo administrador." : "Pagar com PIX Online"}
                    className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'Pix' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'} disabled:bg-gray-100 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-500`}
                >
                    PIX Online
                </button>
              </div>
          </div>
          
          <button onClick={handleBooking} className="w-full mt-6 btn-primary text-white font-bold py-3 px-4 rounded-lg text-lg disabled:bg-gray-400">
            {paymentMethod === 'Pix' ? 'Agendar e Pagar com PIX' : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
      
      {bookingAttempt && paymentMethod === 'Pix' && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center border-t-4 border-primary">
              {pixStatus === 'loading' && (
                  <div className="flex flex-col items-center justify-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div><p className="mt-4 font-semibold text-gray-600 dark:text-gray-300">Gerando PIX seguro...</p></div>
              )}
              {pixStatus === 'generated' && pixDetails && (
                  <>
                      <p className="font-semibold mb-2">Pague com PIX para confirmar</p>
                      <div className="relative inline-block">
                        <img src={pixDetails.qrCodeUrl} alt="QR Code PIX" className={`mx-auto rounded-lg transition-opacity duration-300 ${isPixExpired ? 'opacity-20' : ''}`} />
                        {isPixExpired && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                                <p className="text-white font-bold text-xl">Expirado</p>
                                <button onClick={initiatePixPayment} className="mt-2 text-sm btn-secondary text-white font-bold py-1 px-3 rounded-lg">Gerar Novo PIX</button>
                           </div>
                        )}
                      </div>
                       <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm font-semibold">
                          {isPixExpired ? 'Seu código PIX expirou e o agendamento foi cancelado.' : `Aguardando pagamento... Expira em ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                      </div>
                      <div className="mt-4">
                          <label className="text-sm font-semibold">PIX Copia e Cola:</label>
                          <textarea readOnly value={pixDetails.copyPaste} className="w-full p-2 mt-1 text-xs bg-white dark:bg-gray-800 border rounded-lg" rows={3} onClick={(e) => (e.target as HTMLTextAreaElement).select()}/>
                          <button onClick={() => { navigator.clipboard.writeText(pixDetails.copyPaste); alert('Código PIX copiado!'); }} className="mt-2 text-sm btn-secondary text-white font-bold py-1 px-3 rounded-lg">Copiar Código</button>
                      </div>
                      {!isPixExpired && (
                          <button onClick={handlePaymentNotified} className="w-full mt-6 btn-secondary text-white font-bold py-3 px-4 rounded-lg text-lg">
                            Já Paguei!
                          </button>
                      )}
                  </>
              )}
               {pixStatus === 'notified' && (
                <div className="flex flex-col items-center justify-center h-48">
                    <CheckCircleIcon className="w-16 h-16 text-secondary mb-4" />
                    <h3 className="text-xl font-bold">Aguardando Confirmação</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                        Recebemos a notificação do seu pagamento.<br/> O administrador irá validar e confirmar seu agendamento em breve.
                    </p>
                    <button onClick={onBack} className="mt-6 text-sm btn-primary text-white font-bold py-2 px-4 rounded-lg">
                        OK
                    </button>
                </div>
              )}
              {pixStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center h-48 text-red-500">
                      <p className="font-semibold">Ocorreu um erro ao gerar o PIX.</p>
                      <button onClick={initiatePixPayment} className="mt-4 text-sm btn-primary text-white font-bold py-2 px-4 rounded-lg">Tentar Novamente</button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default BookingCalendar;