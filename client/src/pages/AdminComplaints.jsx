import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSocket } from '../hooks/useSocket.js';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, statusBadgeClass } from '../utils/status.js';

const PAGE_SIZE = 15;

export default function AdminComplaints() {
  const [data, setData] = useState({ data: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    search: '',
    from: '',
    to: '',
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
  }, [filters.category, filters.status, filters.priority, filters.from, filters.to, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.status, filters.priority, filters.from, filters.to, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useSocket(() => load(), { notify: true });

  const exportPdf = async () => {
    setExporting(true);
    try {
      const params = { ...filters, search: debouncedSearch };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await api.get('/api/complaints/export/pdf', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scp-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">All complaints</h1>
          <p className="text-sm text-slate-500">Filter, update status, and export reports</p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={exportPdf} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} accent="brand" />
          <StatCard label="Pending" value={stats.pending} accent="amber" />
          <StatCard label="Resolved" value={stats.resolved} accent="emerald" />
          <StatCard label="Rejected" value={stats.rejected} accent="red" />
        </div>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="xl:col-span-2">
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-500">From</label>
            <input
              type="date"
              className="input mt-1"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">To</label>
            <input
              type="date"
              className="input mt-1"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : data.data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-500 dark:border-slate-700">
            No complaints match filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Student</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Priority</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {data.data.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                      <Link to={`/complaints/${c._id}`} className="hover:underline">
                        {c.complaintId}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <Link to={`/complaints/${c._id}`} className="hover:text-brand-600 dark:hover:text-brand-400">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {c.isAnonymous ? 'Anonymous Student' : c.student?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[c.category]}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{PRIORITY_LABELS[c.priority]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(c.status)}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pages={data.pages || 1} total={data.total} onPageChange={setPage} />
    </div>
  );
}
