import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../../components/Spinner.jsx';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await adminLogin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4">
      <div className="card w-full max-w-md border-slate-700 bg-slate-900/90 shadow-xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Staff access</p>
        <h1 className="font-display mt-2 text-2xl font-bold text-white">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Use your portal administrator credentials</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          {error && (
            <div className="rounded-xl bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input
              className="input border-slate-600 bg-slate-800/80 text-white placeholder:text-slate-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input
              className="input border-slate-600 bg-slate-800/80 text-white placeholder:text-slate-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-brand-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? <Spinner className="h-5 w-5 border-2" /> : 'Sign in to dashboard'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Student?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:underline">
            Student sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
