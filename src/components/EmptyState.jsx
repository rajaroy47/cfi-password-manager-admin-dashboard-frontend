import React from 'react';

export default function EmptyState({ title, hint }) {
  return (
    <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl bg-slate-50/60">
      <div className="text-slate-500 text-sm font-medium">{title}</div>
      {hint && <div className="text-slate-400 text-xs mt-1">{hint}</div>}
    </div>
  );
}
