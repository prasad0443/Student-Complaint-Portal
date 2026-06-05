export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null;

  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(pages, page + 1));

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {pages}
        {total != null && ` · ${total} total`}
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={page <= 1} onClick={prev}>
          Previous
        </button>
        <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={page >= pages} onClick={next}>
          Next
        </button>
      </div>
    </div>
  );
}
