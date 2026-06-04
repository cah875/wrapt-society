import { useCallback, useEffect, useState } from 'react';
import { checkAuth, login as apiLogin, logout as apiLogout } from '../lib/api.js';

/** Tracks login state: 'checking' → 'anon' | 'authed'. */
export function useAuth() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await checkAuth();
      if (!cancelled) setStatus(ok ? 'authed' : 'anon');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    await apiLogin(username, password);
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setStatus('anon');
  }, []);

  return { status, login, logout };
}
