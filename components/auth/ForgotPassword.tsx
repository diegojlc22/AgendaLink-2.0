import React, { useState } from 'react';
import { useAppContext } from '../../App';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const { resetPassword, state } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const newPassword = resetPassword(email);
      alert(`Sua nova senha é: ${newPassword}\n\nAnote-a e faça login.`);
      setMessage('Sua senha foi redefinida. Uma nova senha foi informada em um alerta. Por favor, utilize-a para fazer login.');
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800">
        <div className="text-center">
           <img src={state.settings.branding.logoUrl} alt="Logo" className="w-16 h-16 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite seu e-mail para redefinir sua senha.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
          {message && <p className="p-3 text-sm text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white rounded-lg btn-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Redefinir Senha
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500">
            Lembrou sua senha?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
              Voltar para o Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;