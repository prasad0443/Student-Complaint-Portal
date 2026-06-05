import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Sidebar({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { toggle, isDark } = useTheme();

  const studentLinks = [
    { to: '/', label: 'My complaints', end: true },
    { to: '/complaints/new', label: 'New complaint' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'All complaints', end: true },
    { to: '/admin/analytics', label: 'Analytics' },
    ...(user?.role === 'super_admin' ? [{ to: '/admin/register', label: 'Add admin' }] : []),
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <p className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">SCP</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Student Complaint Portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {(isAdmin ? adminLinks : studentLinks).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => onNavigate?.()}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <p className="truncate px-2 text-xs font-medium text-slate-800 dark:text-slate-200">{user?.name}</p>
        <p className="truncate px-2 text-xs text-slate-500">{isAdmin ? 'Administrator' : user?.studentId || user?.email}</p>
        <button type="button" className="btn-secondary mt-3 w-full text-xs" onClick={toggle}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button type="button" className="btn-secondary mt-2 w-full text-xs text-red-600 dark:text-red-400" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
