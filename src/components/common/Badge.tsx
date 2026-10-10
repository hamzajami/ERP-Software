// src/components/common/Badge.tsx
import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, size = 'sm', children }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    switch (variant) {
      case 'success':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'info':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'purple':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'slate':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
    }
  } else {
    // Automatic matching by status name
    if (['pass', 'completed', 'paid', 'available', 'closed'].includes(normalized)) {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (
      [
        'in_production',
        'partially_received',
        'partially_paid',
        'material_issued',
        'in_use',
      ].includes(normalized)
    ) {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (['fail', 'rework', 'cancelled', 'damaged', 'unpaid', 'low_stock'].includes(normalized)) {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (['confirmed', 'dispatched', 'open'].includes(normalized)) {
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (['planned', 'at_engraver'].includes(normalized)) {
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const label = children || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium capitalize rounded-md border tracking-tight ${sizeClasses} ${colorClasses}`}
    >
      {label}
    </span>
  );
};
