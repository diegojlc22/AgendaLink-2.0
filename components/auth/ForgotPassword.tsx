
import React, { useState } from 'react';
import { useAppContext } from '../../App';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const { resetPassword, state } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copiar');

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopyButtonText('Copiado!');
    setTimeout(() => {
      setCopyButtonText('Copiar');
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewPassword('');
    try {
      const generatedPassword = resetPassword(email);
      setNewPassword(generatedPassword);
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
            Recuperar Senha
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite seu e-mail para redefinir sua senha.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
          
          {newPassword && (
            <div className="p-4 text-center text-green-800 bg-green-100 rounded-lg space-y-3 dark:bg-green-900/20 dark:text-green-300">
                <p className="font-semibold">Senha redefinida com sucesso!</p>
                <p className="text-sm">Anote sua nova senha e guarde em um local seguro.</p>
                <div className="flex items-center justify-center gap-2 p-2 bg-green-200 dark:bg-green-900/30 rounded-md">
                    <code className="text-lg font-mono font-bold text-green-900 dark:text-green-200">{newPassword}</code>
                    <button 
                        type="button" 
                        onClick={handleCopyPassword} 
                        className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                        {copyButtonText}
                    </button>
                </div>
            </div>
          )}

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