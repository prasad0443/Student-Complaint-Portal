import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner.jsx';
import { CATEGORY_LABELS } from '../utils/status.js';

export default function NewComplaint() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('academics');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('description', description);
      fd.append('anonymous', String(anonymous));
      files.forEach((f) => fd.append('attachments', f));
      const { data } = await api.post('/api/complaints', fd);
      navigate(`/complaints/${data._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">New complaint</h1>
      <p className="text-sm text-slate-500">Describe your issue. You may attach images or PDFs (max 5 files, 5MB each).</p>

      <form className="card mt-6 max-w-2xl space-y-4" onSubmit={submit}>
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
          <textarea
            className="input min-h-[140px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={10000}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="anon"
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="anon" className="text-sm text-slate-700 dark:text-slate-300">
            Submit as anonymous (your name hidden from other students; staff can still see your account)
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Attachments</label>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 dark:text-slate-300 dark:file:bg-brand-950 dark:file:text-brand-300"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? <Spinner className="h-5 w-5 border-2" /> : 'Submit complaint'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
