import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Services() {
  const [services, setServices] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  // Deletion is admin-only on the server too (see serviceRoutes.js) - this
  // just hides the button for staff so they don't hit a 403.
  const isAdmin = Api.getCurrentUser()?.role === 'ADMIN';

  async function load() {
    setLoading(true);
    try {
      const data = await Api.listServices();
      setServices(data.services);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await Api.createService(newName.trim());
      setNewName('');
      toast('Service added');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDelete() {
    try {
      await Api.deleteService(deleteTarget._id);
      toast('Service deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Services</h1>
      <p className="text-sm text-slate-500 mb-6">
        Income Tax, GST, MCA, FSSAI, Email, Banking or anything else.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. TDS Portal"
          className="w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          Add Service
        </button>
      </form>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" hint="Add your first service above." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <span
              key={s._id}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
            >
              {s.name}
              {isAdmin && (
                <button
                  onClick={() => setDeleteTarget(s)}
                  title="Delete service"
                  aria-label={`Delete ${s.name}`}
                  className="w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete service?"
        message={`This will permanently remove "${deleteTarget?.name}". Services still used by active credentials cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
