import React, { useState, lazy, Suspense } from 'react';

const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));


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

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>}>
            {renderView()}
        </Suspense>
    );
}

export default AuthPage;