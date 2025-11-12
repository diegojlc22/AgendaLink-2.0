import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { Promotion } from '../../types';
import { ClockIcon } from '../common/Icons';

const CountdownTimer: React.FC<{ expiry: string }> = ({ expiry }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiry) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutos: Math.floor((difference / 1000 / 60) % 60),
                segundos: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    // FIX: Changed JSX.Element[] to React.ReactElement[] to fix "Cannot find namespace 'JSX'" error.
    const timerComponents: React.ReactElement[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval as keyof typeof timeLeft]) {
            return;
        }

        timerComponents.push(
            <div key={interval} className="text-center">
                <span className="text-2xl font-bold">{timeLeft[interval as keyof typeof timeLeft]}</span>
                <span className="block text-xs">{interval}</span>
            </div>
        );
    });

    return (
        <div className="flex space-x-4 text-secondary">
            {timerComponents.length ? timerComponents : <span className="text-red-500 font-bold">Promoção Encerrada!</span>}
        </div>
    );
};

const PromotionCard: React.FC<{ promotion: Promotion }> = ({ promotion }) => {
  const { state } = useAppContext();
  const applicableServices = state.services.filter(s => promotion.serviceIds.includes(s.id));

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border-l-4 border-secondary">
      <h3 className="text-2xl font-bold text-secondary">{promotion.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mt-2">{promotion.description}</p>
      <div className="mt-4">
        <span className="font-semibold">Serviços inclusos:</span>
        <ul className="list-disc list-inside ml-4 text-sm">
          {applicableServices.map(s => <li key={s.id}>{s.name}</li>)}
        </ul>
      </div>
      {/* FIX: Replaced non-existent 'limitType' and 'limitValue' with properties from the Promotion type. */}
      {promotion.endDate && (
        <div className="mt-6 flex items-center space-x-3">
            <ClockIcon className="h-8 w-8 text-secondary"/>
            <CountdownTimer expiry={promotion.endDate} />
        </div>
      )}
       {typeof promotion.usageLimit === 'number' && (
        <div className="mt-6">
            <p><span className="font-bold">{promotion.usageLimit - promotion.uses}</span> agendamentos restantes!</p>
        </div>
      )}
    </div>
  );
};

const Promotions: React.FC = () => {
  const { state } = useAppContext();
  const { promotions } = state;

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Promoções Especiais</h2>
      {promotions.length > 0 ? (
        <div className="space-y-6">
          {promotions.map(promo => <PromotionCard key={promo.id} promotion={promo} />)}
        </div>
      ) : (
        <p className="text-gray-500">Nenhuma promoção ativa no momento.</p>
      )}
    </div>
  );
};

export default Promotions;