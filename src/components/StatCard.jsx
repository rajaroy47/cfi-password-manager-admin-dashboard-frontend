import React from 'react';

export default function StatCard({ label, value, hint, accent = 'brand' }) {
  const accents = {
    brand: 'text-brand-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${accents[accent] || accents.brand}`}>{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
