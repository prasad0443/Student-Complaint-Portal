import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Spinner from '../../components/Spinner.jsx';

/**
 * Create additional admin accounts (super_admin only). Backend: POST /api/admin/register
 */
export default function AdminRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPending(true);
    try {
      await api.post('/api/admin/register', { email: email.trim(), password, name: name.trim() });
      setSuccess('Admin account created. They can sign in at /admin/login.');
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <Link to="/admin" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
        ← Back to dashboard
      </Link>
      <div className="mx-auto mt-6 max-w-md">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Register admin</h1>
        <p className="mt-1 text-sm text-slate-500">Creates a user with role &quot;admin&quot;. Super-admin only.</p>
        <form className="card mt-6 space-y-4" onSubmit={submit}>
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Password (min 8)</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? <Spinner className="h-5 w-5 border-2" /> : 'Create admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
