import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ClientDetail from '../components/ClientDetail.jsx';
import { useToast } from '../components/Toast.jsx';

const emptyForm = { name: '', clientCode: '', pan: '', gstin: '', phone: '', email: '', address: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}&limit=500` : '?limit=500';
      const data = await Api.listClients(params);
      setClients(data.clients);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(client) {
    setEditing(client);
    setForm({ ...emptyForm, ...client });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await Api.updateClient(editing._id, form);
        toast('Client updated');
      } else {
        await Api.createClient(form);
        toast('Client created successfully');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDelete() {
    try {
      await Api.deleteClient(deleteTarget._id);
      toast('Client deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clients</h1>
          <p className="text-sm text-slate-500">Organize credentials by the businesses you file for.</p>
        </div>
        <button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Client
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search by name, code, PAN, GSTIN… (click a row to open their file)"
        className="w-80 px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : clients.length === 0 ? (
        <EmptyState title="No clients found" hint="Add your first client to start organizing credentials." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">PAN</th>
                <th className="text-left px-4 py-3 font-medium">GSTIN</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c._id} onClick={() => setViewingId(c._id)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-brand-700 hover:underline">{c.name}</td>
                  <td className="px-4 py-3 mono text-slate-600">{c.clientCode || '—'}</td>
                  <td className="px-4 py-3 mono text-slate-600">{c.pan || '—'}</td>
                  <td className="px-4 py-3 mono text-slate-600">{c.gstin || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'ACTIVE' ? 'active' : 'inactive'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)} className="text-brand-600 hover:underline text-xs font-medium">
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="text-rose-600 hover:underline text-xs font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-[480px] shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-ink text-base mb-4">{editing ? 'Edit Client' : 'Add Client'}</h3>
            {[
              ['name', 'Client Name *'],
              ['clientCode', 'Client Code'],
              ['pan', 'PAN'],
              ['gstin', 'GSTIN'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['address', 'Address'],
            ].map(([key, label]) => (
              <div className="mb-3" key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  required={key === 'name'}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            ))}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200">
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
                {editing ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete client?"
        message={`This will permanently remove "${deleteTarget?.name}". Clients with active credentials cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      {viewingId && <ClientDetail clientId={viewingId} onClose={() => setViewingId(null)} onChanged={load} />}
    </div>
  );
}
