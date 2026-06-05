export const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const CATEGORY_LABELS = {
  academics: 'Academics',
  hostel: 'Hostel',
  IT: 'IT',
  fees: 'Fees',
  others: 'Others',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function statusBadgeClass(status) {
  const map = {
    submitted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    in_progress: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  };
  return map[status] || map.submitted;
}
