import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import Badge from './Badge.jsx';
import EmptyState from './EmptyState.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from './Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyCredForm = { service: '', websiteName: '', websiteUrl: '', username: '', password: '', notes: '' };

/**
 * Client 360 view: client details up top (the stuff that's saved once per
 * client — name, PAN, GSTIN, phone, email, address), and every website
 * login saved for that client underneath. This is the screen an employee
 * lands on after searching for a client by name — everything they need
 * for that client, in one place.
 */
export default function ClientDetail({ clientId, onClose, onChanged }) {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [services, setServices] = useState([]);
  const [credSearch, setCredSearch] = useState('');
  const [revealed, setRevealed] = useState({});
  const [showCredForm, setShowCredForm] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [credForm, setCredForm] = useState(emptyCredForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const canReveal = hasPermission('canRevealPasswords');
  const canEdit = hasPermission('canEditCredentials');
  const canDelete = hasPermission('canDeleteCredentials');
  const canCreate = hasPermission('canCreateCredentials');

  async function load() {
    setLoading(true);
    try {
      const [clientData, servicesData] = await Promise.all([Api.getClient(clientId), Api.listServices()]);
      setClient(clientData.client);
      setCredentials(clientData.credentials || []);
      setServices(servicesData.services);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Escape key closes the drawer, same as clicking the backdrop.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function openNewCred() {
    setEditingCred(null);
    setCredForm(emptyCredForm);
    setShowCredForm(true);
  }

  function openEditCred(cred) {
    setEditingCred(cred);
    setCredForm({
      service: cred.service?._id || cred.service || '',
      websiteName: cred.websiteName,
      websiteUrl: cred.websiteUrl,
      username: cred.username,
      password: '',
      notes: cred.notes || '',
    });
    setShowCredForm(true);
  }

  async function handleSaveCred(e) {
    e.preventDefault();
    try {
      if (editingCred) {
        const payload = { ...credForm };
        if (!payload.password) delete payload.password;
        await Api.updateCredential(editingCred.id, payload);
        toast('Login updated');
      } else {
        await Api.createCredential({ ...credForm, client: clientId });
        toast('✓ Login saved successfully');
      }
      setShowCredForm(false);
      load();
      onChanged?.();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteCred() {
    try {
      await Api.deleteCredential(deleteTarget.id);
      toast('Credential deactivated');
      setDeleteTarget(null);
      load();
      onChanged?.();
    } catch (err) {
      toast(err.message, 'error');
      setDeleteTarget(null);
    }
  }

  async function toggleReveal(cred) {
    if (revealed[cred.id]) {
      setRevealed((r) => ({ ...r, [cred.id]: undefined }));
      return;
    }
    try {
      const data = await Api.revealCredential(cred.id);
      setRevealed((r) => ({ ...r, [cred.id]: data.password }));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function copyPassword(cred) {
    try {
      const data = await Api.copyCredential(cred.id);
      await navigator.clipboard.writeText(data.password);
      toast(`Password copied. Clipboard clears in ${data.clipboardTimeoutSeconds}s.`);
      setTimeout(async () => {
        const current = await navigator.clipboard.readText().catch(() => null);
        if (current === data.password) await navigator.clipboard.writeText('');
      }, data.clipboardTimeoutSeconds * 1000);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function copyUsername(cred) {
    navigator.clipboard.writeText(cred.username);
    toast('Username copied');
  }

  const visibleCreds = credSearch
    ? credentials.filter((c) => {
        const q = credSearch.toLowerCase();
        return (
          c.websiteName.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q) ||
          (c.service?.name || '').toLowerCase().includes(q)
        );
      })
    : credentials;

  const initials = (client?.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative w-full max-w-3xl h-full bg-slate-50 shadow-2xl overflow-y-auto animate-[slideIn_0.18s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>

        {loading || !client ? (
          <div className="p-10 text-slate-400 text-sm">Loading client…</div>
        ) : (
          <>
            {/* ---- Client details header ---- */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-ink">{client.name}</h2>
                      <Badge variant={client.status === 'ACTIVE' ? 'active' : 'inactive'}>{client.status}</Badge>
                    </div>
                    {client.clientCode && <div className="text-xs text-slate-400 mono mt-0.5">Client Code: {client.clientCode}</div>}
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1" title="Close">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mt-6">
                <Field label="PAN" value={client.pan} mono />
                <Field label="GSTIN" value={client.gstin} mono />
                <Field label="Phone" value={client.phone} />
                <Field label="Email" value={client.email} />
                <Field label="Address" value={client.address} span2 />
              </div>

              {client.notes && (
                <div className="mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-500">Notes: </span>
                  {client.notes}
                </div>
              )}
            </div>

            {/* ---- Credentials for this client ---- */}
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-ink">Saved Logins</h3>
                  <p className="text-xs text-slate-500">
                    {credentials.length} website credential{credentials.length === 1 ? '' : 's'} saved for {client.name}
                  </p>
                </div>
                {canCreate && (
                  <button onClick={openNewCred} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                    + Add Login
                  </button>
                )}
              </div>

              {credentials.length > 3 && (
                <input
                  value={credSearch}
                  onChange={(e) => setCredSearch(e.target.value)}
                  placeholder="🔍 Filter this client's logins…"
                  className="w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}

              {credentials.length === 0 ? (
                <EmptyState title="No logins saved yet" hint="Add this client's first website credential to get started." />
              ) : visibleCreds.length === 0 ? (
                <EmptyState title="No matches" hint="Try a different search term." />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {visibleCreds.map((cred) => (
                    <div key={cred.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <a href={`${cred.websiteUrl}`} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline truncate">
                            {cred.websiteName}
                          </a>
                          {cred.service?.name && <Badge variant="staff">{cred.service.name}</Badge>}
                          {!cred.isActive && <Badge variant="inactive">Inactive</Badge>}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate">{cred.hostname}</div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Username</div>
                          <div className="flex items-center gap-1">
                            <span className="mono text-sm text-slate-700">{cred.username}</span>
                            <button onClick={() => copyUsername(cred)} className="text-xs text-slate-400 hover:text-brand-600" title="Copy username">
                              📋
                            </button>
                          </div>
                        </div>
                        <div className="text-right w-32">
                          <div className="text-xs text-slate-400">Password</div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="mono text-sm text-slate-700">{revealed[cred.id] || '••••••••••'}</span>
                            {canReveal && (
                              <>
                                <button onClick={() => toggleReveal(cred)} className="text-xs text-slate-400 hover:text-brand-600" title="Show/hide">
                                  👁
                                </button>
                                <button onClick={() => copyPassword(cred)} className="text-xs text-slate-400 hover:text-brand-600" title="Copy password">
                                  📋
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          {canEdit && (
                            <button onClick={() => openEditCred(cred)} className="text-brand-600 hover:underline font-medium">
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(cred)} className="text-rose-600 hover:underline font-medium">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showCredForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <form onSubmit={handleSaveCred} className="bg-white rounded-xl p-6 w-[480px] shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-ink text-base mb-1">{editingCred ? 'Edit Login' : 'Add Login'}</h3>
            <p className="text-xs text-slate-400 mb-4">for {client?.name}</p>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Service *</label>
              <select
                required
                value={credForm.service}
                onChange={(e) => setCredForm({ ...credForm, service: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Select service…</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {[
              ['websiteName', 'Website Name *'],
              ['websiteUrl', 'Website URL *'],
              ['username', 'Username *'],
              ['password', editingCred ? 'New Password (leave blank to keep current)' : 'Password *'],
            ].map(([key, label]) => (
              <div className="mb-3" key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  required={key !== 'password' || !editingCred}
                  type="text"
                  value={credForm[key] || ''}
                  onChange={(e) => setCredForm({ ...credForm, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mono"
                />
              </div>
            ))}

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={credForm.notes || ''}
                onChange={(e) => setCredForm({ ...credForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowCredForm(false)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200">
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
                {editingCred ? 'Save Changes' : 'Save Login'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate credential?"
        message="It will be hidden from autofill and search, but preserved in the audit history."
        onConfirm={handleDeleteCred}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}

function Field({ label, value, mono, span2 }) {
  return (
    <div className={span2 ? 'col-span-2 sm:col-span-3' : ''}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
      <div className={`text-sm mt-0.5 ${value ? 'text-ink' : 'text-slate-300'} ${mono && value ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}
