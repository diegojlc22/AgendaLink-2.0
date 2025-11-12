import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../App';
import { Service, AppointmentStatus, Promotion, Appointment } from '../../types';
import { ClockIcon, CheckCircleIcon } from '../common/Icons';
import { generateBRCode } from '../../utils/pix';

// --- SIMULAÇÃO DE API BACKEND ---
// Esta função agora usa a chave PIX real das configurações do app.
const generateDynamicPix = (amount: number, pixKey: string): Promise<{ qrCodeUrl: string; copyPaste: string; transactionId: string }> => {
  console.log(`[API MOCK] Gerando PIX dinâmico para R$ ${amount.toFixed(2)} com a chave: ${pixKey}`);
  return new Promise((resolve, reject) => {
    // Validação para garantir que a chave PIX foi fornecida.
    if (!pixKey || pixKey.trim() === '') {
        return reject(new Error("Chave PIX não configurada."));
    }
    setTimeout(() => {
      const transactionId = `TXID_${Date.now()}`;
      // Usa a chave PIX real fornecida pelas configurações
      const copyPasteCode = generateBRCode(pixKey, amount, 'AgendaLink', 'SAO PAULO', transactionId);
      
      const response = {
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(copyPasteCode)}`,
        copyPaste: copyPasteCode,
        transactionId: transactionId,
      };
      console.log('[API MOCK] PIX Gerado:', response);
      resolve(response);
    }, 1500); // Simula a latência da rede
  });
};

// Simula o backend recebendo uma notificação de pagamento via webhook
const listenForPaymentConfirmation = (transactionId: string, callback: () => void) => {
    console.log(`[API MOCK] Ouvindo confirmação para a transação: ${transactionId}`);
    const timeout = setTimeout(() => {
        console.log(`[API MOCK] Pagamento confirmado para ${transactionId}!`);
        callback();
    }, 8000); // Simula o tempo que o cliente leva para pagar

    return () => clearTimeout(timeout); // Função para limpar o listener
};


interface BookingCalendarProps {
  service: Service;
  onBack: () => void;
}

type PixStatus = 'idle' | 'loading' | 'generated' | 'paid';

const BookingCalendar: React.FC<BookingCalendarProps> = ({ service, onBack }) => {
  const { state, setState, currentUser } = useAppContext();
  const { pixKey } = state.settings.pixCredentials; // Pega a chave PIX real das configurações
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Local'>('Local');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });
  const [newAppointment, setNewAppointment] = useState<Appointment | null>(null);
  
  // Estados para o fluxo de PIX
  const [pixStatus, setPixStatus] = useState<PixStatus>('idle');
  const [pixDetails, setPixDetails] = useState<{ qrCodeUrl: string; copyPaste: string; transactionId: string } | null>(null);

  const finalPrice = service.price - discount;

  useEffect(() => {
    // Inicia a geração do PIX quando o método é selecionado
    const generatePix = async () => {
        if (paymentMethod === 'Pix' && pixStatus === 'idle' && finalPrice > 0) {
            setPixStatus('loading');
            try {
                // Passa a chave PIX das configurações para a função de geração
                const details = await generateDynamicPix(finalPrice, pixKey);
                setPixDetails(details);
                setPixStatus('generated');
            } catch (error) {
                console.error("Falha ao gerar PIX:", error);
                setPixStatus('idle'); // Volta ao estado inicial em caso de erro
                alert("Não foi possível gerar o PIX. O administrador precisa configurar uma chave PIX nas configurações do painel.");
                setPaymentMethod('Local'); // Retorna para o método de pagamento local
            }
        }
    };
    generatePix();
  }, [paymentMethod, pixStatus, finalPrice, pixKey]); // Adicionadas dependências corretas

  useEffect(() => {
      if (pixStatus === 'generated' && pixDetails?.transactionId && newAppointment) {
          const unsubscribe = listenForPaymentConfirmation(pixDetails.transactionId, () => {
              setState(prev => ({
                  ...prev,
                  appointments: prev.appointments.map(appt =>
                      appt.id === newAppointment.id
                          ? { ...appt, status: AppointmentStatus.Confirmed, paymentConfirmed: true }
                          : appt
                  ),
              }));
              setPixStatus('paid');
          });
          return unsubscribe; // Limpa o listener se o componente for desmontado
      }
  }, [pixStatus, pixDetails, newAppointment, setState]);


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
    
    const calculatedFinalPrice = service.price - discount;

    const appointmentData: Appointment = {
      id: new Date().toISOString(),
      serviceId: service.id,
      clientId: currentUser.id,
      startTime: selectedSlot.toISOString(),
      endTime: new Date(selectedSlot.getTime() + service.duration * 60000).toISOString(),
      status: paymentMethod === 'Pix' ? AppointmentStatus.Pending : AppointmentStatus.Confirmed,
      paymentMethod,
      paymentConfirmed: false,
      appliedPromoId: appliedPromo?.id,
      finalPrice: calculatedFinalPrice,
    };
    
    setNewAppointment(appointmentData);

    setState(prev => {
        const newAppointments = [...prev.appointments, appointmentData];
        const newPromotions = appliedPromo ? prev.promotions.map(p => 
            p.id === appliedPromo.id ? { ...p, uses: p.uses + 1 } : p
        ) : prev.promotions;

        return {
          ...prev,
          appointments: newAppointments,
          promotions: newPromotions,
        }
    });
    
    // Se não for PIX, o fluxo termina aqui.
    if (paymentMethod !== 'Pix') {
        alert('Agendamento confirmado com sucesso!');
        onBack();
    }
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const handlePaymentMethodChange = (method: 'Pix' | 'Local') => {
    setPaymentMethod(method);
    // Reseta o estado do PIX se o usuário trocar de método
    setPixStatus('idle');
    setPixDetails(null);
    setNewAppointment(null);
  };
  
  if (pixStatus === 'paid' && newAppointment) {
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
        <button onClick={onBack} className="text-primary hover:underline disabled:text-gray-400" disabled={!!newAppointment}>
          &larr; Voltar
        </button>
        <h2 className="text-2xl font-bold text-center">{service.name}</h2>
        <div/>
      </div>

      <div className={newAppointment ? 'opacity-50 pointer-events-none' : ''}>
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

      {selectedSlot && !newAppointment && (
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
                  <button onClick={() => handlePaymentMethodChange('Local')} className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'Local' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'}`}>Pagar no Local</button>
                  <button 
                    onClick={() => handlePaymentMethodChange('Pix')} 
                    disabled={!pixKey}
                    title={!pixKey ? "O pagamento com PIX não foi configurado pelo administrador." : "Pagar com PIX Online"}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'Pix' ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300 dark:border-gray-600'
                    } disabled:bg-gray-100 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-500 disabled:border-gray-300 dark:disabled:border-gray-600`}
                >
                    PIX Online
                </button>
              </div>
          </div>
          
          <button
            onClick={handleBooking}
            className="w-full mt-6 btn-primary text-white font-bold py-3 px-4 rounded-lg text-lg disabled:bg-gray-400"
          >
            {paymentMethod === 'Pix' ? 'Agendar e Pagar com PIX' : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
      
      {newAppointment && paymentMethod === 'Pix' && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center border-t-4 border-primary">
              {pixStatus === 'loading' && (
                  <div className="flex flex-col items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 font-semibold text-gray-600 dark:text-gray-300">Gerando PIX seguro...</p>
                  </div>
              )}
              {pixStatus === 'generated' && pixDetails && (
                  <>
                      <p className="font-semibold mb-2">Pague com PIX para confirmar</p>
                      <img src={pixDetails.qrCodeUrl} alt="QR Code PIX" className="mx-auto rounded-lg" />
                       <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm font-semibold">
                          Aguardando pagamento...
                      </div>
                      <div className="mt-4">
                          <label className="text-sm font-semibold">PIX Copia e Cola:</label>
                          <textarea
                              readOnly
                              value={pixDetails.copyPaste}
                              className="w-full p-2 mt-1 text-xs bg-white dark:bg-gray-800 border rounded-lg"
                              rows={3}
                              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          />
                          <button
                              onClick={() => {
                                  navigator.clipboard.writeText(pixDetails.copyPaste);
                                  alert('Código PIX copiado!');
                              }}
                              className="mt-2 text-sm btn-secondary text-white font-bold py-1 px-3 rounded-lg"
                          >
                              Copiar Código
                          </button>
                      </div>
                  </>
              )}
          </div>
      )}
    </div>
  );
};

export default BookingCalendar;