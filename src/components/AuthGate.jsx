import { useAuth } from '../hooks/useAuth.js';
import LoginScreen from './LoginScreen.jsx';

/**
 * Renders the login screen until authenticated, then the app. Keeping the app
 * unmounted until login means its hooks (camera, scanner) don't run for
 * anonymous visitors, and the gated API endpoints stay protected.
 */
export default function AuthGate({ children }) {
  const { status, login } = useAuth();

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinical-50 text-clinical-500">
        Loading…
      </div>
    );
  }

  if (status !== 'authed') {
    return <LoginScreen onLogin={login} />;
  }

  return children;
}
