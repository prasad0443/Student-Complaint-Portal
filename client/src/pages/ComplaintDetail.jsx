import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, statusBadgeClass } from '../utils/status.js';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminForm, setAdminForm] = useState({
    status: '',
    priority: '',
    department: '',
    adminNote: '',
    timelineNote: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminError, setAdminError] = useState('');

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get(`/api/complaints/${id}`);
      setC(data);
      setAdminForm((f) => ({
        ...f,
        status: data.status,
        priority: data.priority,
        department: data.department || '',
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useSocket((payload) => {
    const cid = payload?.complaint?._id;
    if (cid && cid === id) load();
  });

  const removeComplaint = async () => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/complaints/${id}`);
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch (e) {
      setAdminError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const saveAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setSaving(true);
    try {
      const { data } = await api.put(`/api/complaints/${id}`, {
        status: adminForm.status,
        priority: adminForm.priority,
        department: adminForm.department,
        adminNote: adminForm.adminNote || undefined,
        timelineNote: adminForm.timelineNote || undefined,
      });
      setC(data);
      setAdminForm((f) => ({ ...f, adminNote: '', timelineNote: '' }));
    } catch (e) {
      setAdminError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }
  if (error || !c) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700 dark:bg-red-950/50 dark:text-red-300">
        {error || 'Not found'}
      </div>
    );
  }

  const timeline = [...(c.timeline || [])].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div>
      <Link to={isAdmin ? '/admin' : '/'} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
        ← Back to list
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-brand-600 dark:text-brand-400">{c.complaintId}</p>
          <h1 className="font-display mt-1 text-2xl font-bold text-slate-900 dark:text-white">{c.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {CATEGORY_LABELS[c.category]} · {PRIORITY_LABELS[c.priority]}
            {c.department ? ` · ${c.department}` : ''}
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${statusBadgeClass(c.status)}`}>
          {STATUS_LABELS[c.status]}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
            {c.isAnonymous && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Submitted anonymously</p>
            )}
          </section>

          {(c.attachments || []).length > 0 && (
            <section className="card">
              <h2 className="font-semibold text-slate-900 dark:text-white">Attachments</h2>
              <ul className="mt-3 space-y-2">
                {c.attachments.map((a, i) => (
                  <li key={i}>
                    <a
                      href={a.url || a.path}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {a.originalName || a.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Status timeline</h2>
            <ol className="relative mt-6 border-l border-slate-200 dark:border-slate-700">
              {timeline.map((t) => (
                <li key={t._id} className="mb-6 ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-brand-500 dark:border-slate-900" />
                  <time className="text-xs text-slate-500">{new Date(t.at).toLocaleString()}</time>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{STATUS_LABELS[t.status]}</p>
                  {t.note && <p className="text-sm text-slate-600 dark:text-slate-400">{t.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Submitter</h2>
            {c.isAnonymous ? (
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Anonymous Student</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.student?.name || '—'}</p>
                {isAdmin && c.student?.email && <p className="text-xs text-slate-500">{c.student.email}</p>}
                {isAdmin && c.student?.studentId && <p className="text-xs text-slate-500">ID: {c.student.studentId}</p>}
              </>
            )}
          </section>

          {(c.adminNotes || []).length > 0 && (
            <section className="card">
              <h2 className="font-semibold text-slate-900 dark:text-white">Admin notes</h2>
              <ul className="mt-3 space-y-3">
                {c.adminNotes.map((n) => (
                  <li key={n._id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/80">
                    <p className="text-slate-700 dark:text-slate-200">{n.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {n.by?.name || 'Admin'} · {new Date(n.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isAdmin && c.status === 'submitted' && c.viewerIsOwner && (
            <section className="card">
              <h2 className="font-semibold text-slate-900 dark:text-white">Withdraw complaint</h2>
              <p className="mt-2 text-sm text-slate-500">You can delete this complaint while it is still in submitted status.</p>
              <button
                type="button"
                className="btn-secondary mt-4 w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                disabled={deleting}
                onClick={removeComplaint}
              >
                {deleting ? 'Deleting…' : 'Delete complaint'}
              </button>
              {adminError && <p className="mt-2 text-sm text-red-600">{adminError}</p>}
            </section>
          )}

          {isAdmin && (
            <section className="card border-brand-200 dark:border-brand-900">
              <h2 className="font-semibold text-slate-900 dark:text-white">Update complaint</h2>
              {adminError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{adminError}</p>
              )}
              <form className="mt-4 space-y-3" onSubmit={saveAdmin}>
                <div>
                  <label className="text-xs font-medium text-slate-500">Status</label>
                  <select
                    className="input mt-1"
                    value={adminForm.status}
                    onChange={(e) => setAdminForm((f) => ({ ...f, status: e.target.value }))}
                  >
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
                    value={adminForm.priority}
                    onChange={(e) => setAdminForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Department</label>
                  <input
                    className="input mt-1"
                    value={adminForm.department}
                    onChange={(e) => setAdminForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. IT Helpdesk"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Timeline note (optional)</label>
                  <input
                    className="input mt-1"
                    value={adminForm.timelineNote}
                    onChange={(e) => setAdminForm((f) => ({ ...f, timelineNote: e.target.value }))}
                    placeholder="Shown on timeline"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Internal note</label>
                  <textarea
                    className="input mt-1 min-h-[72px]"
                    value={adminForm.adminNote}
                    onChange={(e) => setAdminForm((f) => ({ ...f, adminNote: e.target.value }))}
                    placeholder="Add a note for the record"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={saving}>
                  {saving ? <Spinner className="h-5 w-5 border-2" /> : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-3 w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                  disabled={deleting}
                  onClick={removeComplaint}
                >
                  {deleting ? 'Deleting…' : 'Delete complaint'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
