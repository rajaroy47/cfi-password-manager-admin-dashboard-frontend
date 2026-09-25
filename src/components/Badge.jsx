import React from 'react';

const styles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  admin: 'bg-brand-50 text-brand-700 border-brand-100',
  staff: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function Badge({ children, variant = 'active' }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border ${styles[variant] || styles.active}`}>
      {children}
    </span>
  );
}
