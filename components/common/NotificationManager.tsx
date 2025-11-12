
import React, { useState, useEffect } from 'react';

const NotificationManager: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
          setIsLoading(false);
        });
      });
    } else {
        setIsLoading(false);
    }
  }, []);

  const handleSubscriptionToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações push.');
      return;
    }
    
    if (notificationPermission === 'denied') {
        alert('Você bloqueou as notificações. Por favor, habilite-as nas configurações do seu navegador.');
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    if (isSubscribed) {
      // Unsubscribe
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log('User is unsubscribed.');
        // Here you would also send a request to your backend to remove the subscription
      }
    } else {
      // Subscribe
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== 'granted') return;

        // VAPID public key should be stored securely, ideally fetched from the server.
        // This is a placeholder key. Generate your own VAPID keys.
        const vapidPublicKey = 'BAP_YOUR_PUBLIC_VAPID_KEY_HERE';
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        console.log('User is subscribed:', subscription);
        // IMPORTANT: Send this subscription object to your backend server to store it.
        // Example: await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription), ... });
        setIsSubscribed(true);
        alert('Inscrição para notificações realizada com sucesso!');
      } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        alert('Falha ao se inscrever para notificações.');
      }
    }
  };

  if (isLoading) {
      return <p>Carregando status da notificação...</p>;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return <p className="text-sm text-gray-500">Notificações não são suportadas neste navegador.</p>;
  }


  return (
    <div className="flex items-center space-x-4">
      <p className="font-semibold">Notificações Push:</p>
      <button
        onClick={handleSubscriptionToggle}
        className={`px-4 py-2 rounded-lg font-bold text-white ${
          isSubscribed ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        }`}
        disabled={notificationPermission === 'denied'}
      >
        {isSubscribed ? 'Desativar Notificações' : 'Ativar Notificações'}
      </button>
    </div>
  );
};

export default NotificationManager;
