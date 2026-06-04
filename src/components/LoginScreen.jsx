import { useState } from 'react';

/** Branded login gate shown until the user authenticates. */
export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-clinical-50 px-4">
      <div className="card w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-clinical-200">
            <img src="/logo.png" alt="Northwest Specialty Hospital" className="h-10 w-auto" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-clinical-800">Implant Expiration Tracker</h1>
            <p className="text-sm text-clinical-500">Please sign in to continue</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="field-input"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-status-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary btn-xl w-full">
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
