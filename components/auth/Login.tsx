import React, { useState } from 'react';
import { useAppContext } from '../../App';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { login, state } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800">
        <div className="text-center">
          {state.settings.branding.logoEnabled && state.settings.branding.logoUrl && <img src={state.settings.branding.logoUrl} alt="Logo" className="w-16 h-16 mx-auto" />}
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {state.settings.branding.appName}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Faça login para continuar</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
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
             <div className="flex items-center justify-between">
                <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Senha
                </label>
                <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-xs text-primary hover:underline"
                >
                    Esqueceu a senha?
                </button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
              placeholder="********"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white rounded-lg btn-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Entrar
            </button>
          </div>
        </form>
         <div className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>Não tem uma conta?{' '}
                <button
                    onClick={onSwitchToRegister}
                    className="font-medium text-primary hover:underline"
                >
                    Cadastre-se
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;