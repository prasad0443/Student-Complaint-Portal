import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSocket } from '../hooks/useSocket.js';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, statusBadgeClass } from '../utils/status.js';

const PAGE_SIZE = 10;

export default function StudentDashboard() {
  const [data, setData] = useState({ data: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    search: '',
  });
  const debouncedSearch = useDebounce(filters.search);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { ...filters, search: debouncedSearch, page, limit: PAGE_SIZE };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const [{ data: res }, { data: summary }] = await Promise.all([
        api.get('/api/complaints', { params }),
        api.get('/api/complaints/stats/summary'),
      ]);
      setData(res);
      setStats(summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.status, filters.priority, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.status, filters.priority, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useSocket(() => load(), { notify: true });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">My complaints</h1>
          <p className="text-sm text-slate-500">Track status and timeline for each submission</p>
        </div>
        <Link to="/complaints/new" className="btn-primary shrink-0">
          New complaint
        </Link>
      </div>

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} accent="brand" />
          <StatCard label="Pending" value={stats.pending} hint="Submitted, in review, or in progress" accent="amber" />
          <StatCard label="Resolved" value={stats.resolved} accent="emerald" />
          <StatCard label="Rejected" value={stats.rejected} accent="red" />
        </div>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-500">Search</label>
          <input
            className="input mt-1"
            placeholder="Title, ID, description..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Category</label>
          <select
            className="input mt-1"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Status</label>
          <select
            className="input mt-1"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Priority</label>
          <select
            className="input mt-1"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : data.data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-500 dark:border-slate-700">
            No complaints yet. Submit one to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.data.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/complaints/${c._id}`}
                  className="card block transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-brand-600 dark:text-brand-400">{c.complaintId}</p>
                      <h2 className="mt-1 font-semibold text-slate-900 dark:text-white">{c.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {CATEGORY_LABELS[c.category]} · {PRIORITY_LABELS[c.priority]}
                        {c.isAnonymous && ' · Anonymous'}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(c.status)}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination page={page} pages={data.pages || 1} total={data.total} onPageChange={setPage} />
    </div>
  );
}
