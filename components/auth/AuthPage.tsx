import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

type AuthView = 'login' | 'register' | 'forgotPassword';

const AuthPage: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');

    const renderView = () => {
        switch (view) {
            case 'register':
                return <Register onSwitchToLogin={() => setView('login')} />;
            case 'forgotPassword':
                return <ForgotPassword onSwitchToLogin={() => setView('login')} />;
            case 'login':
            default:
                return <Login 
                    onSwitchToRegister={() => setView('register')} 
                    onSwitchToForgotPassword={() => setView('forgotPassword')}
                />;
        }
    }

    return renderView();
}

export default AuthPage;
