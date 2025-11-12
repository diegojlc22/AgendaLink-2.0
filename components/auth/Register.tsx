import React, { useState } from 'react';
import { useAppContext } from '../../App';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register, state } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !phone || !password) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    try {
      register({ name, email, phone, password, role: 'client' });
      // On success, user is logged in by the register function, so the view will change automatically in App.tsx
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
           <img src={state.settings.branding.logoUrl} alt="Logo" className="w-16 h-16 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Criar Conta
          </h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
            <input
              id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-white dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
              placeholder="Seu Nome"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-white dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
              placeholder="seu@email.com"
            />
          </div>
           <div>
            <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefone / WhatsApp</label>
            <input
              id="phone" name="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-white dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
              placeholder="(99) 99999-9999"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <input
              id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-white dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
              placeholder="********"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white rounded-md btn-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cadastrar
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500">
            Já tem uma conta?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
              Faça login
            </button>
        </div>
      </div>
    </div>
  );
};

export default Register;