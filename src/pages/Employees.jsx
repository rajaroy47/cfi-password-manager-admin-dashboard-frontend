import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import Badge from '../components/Badge.jsx';
import { useToast } from '../components/Toast.jsx';

const PERMISSIONS = [
  ['canViewCredentials', 'View credentials'],
  ['canCreateCredentials', 'Create credentials'],
  ['canEditCredentials', 'Edit credentials'],
  ['canDeleteCredentials', 'Delete credentials'],
  ['canRevealPasswords', 'Reveal passwords'],
  ['canManageClients', 'Manage clients'],
  ['canManageEmployees', 'Manage employees'],
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'STAFF',
  permissions: Object.fromEntries(PERMISSIONS.map(([k]) => [k, k !== 'canManageEmployees' && k !== 'canDeleteCredentials'])),
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resetResult, setResetResult] = useState(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await Api.listEmployees();
      setEmployees(data.employees);
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

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, password: '', role: emp.role, permissions: emp.permissions || emptyForm.permissions });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await Api.updateEmployee(editing._id, { name: form.name, role: form.role, permissions: form.permissions });
        toast('Employee updated');
      } else {
        await Api.createEmployee(form);
        toast('Employee created successfully');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function toggleActive(emp) {
    try {
      await Api.updateEmployee(emp._id, { isActive: !emp.isActive });
      toast(emp.isActive ? 'Employee deactivated' : 'Employee activated');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleResetPassword(emp) {
    if (!confirm(`Reset password for ${emp.name}? A new temporary password will be generated.`)) return;
    try {
      const data = await Api.resetEmployeePassword(emp._id);
      setResetResult({ name: emp.name, password: data.temporaryPassword });
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Employees</h1>
          <p className="text-sm text-slate-500">Manage who can access the vault, and what they can do.</p>
        </div>
        <button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Employee
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.role === 'ADMIN' ? 'admin' : 'staff'}>{emp.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.isActive ? 'active' : 'inactive'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(emp)} className="text-brand-600 hover:underline text-xs font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleResetPassword(emp)} className="text-amber-600 hover:underline text-xs font-medium">
                      Reset Password
                    </button>
                    <button onClick={() => toggleActive(emp)} className="text-rose-600 hover:underline text-xs font-medium">
                      {emp.isActive ? 'Deactivate' : 'Activate'}
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
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-[520px] shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-ink text-base mb-4">{editing ? 'Edit Employee' : 'Add Employee'}</h3>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input required type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100" />
            </div>
            {!editing && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Temporary Password * (min 10 chars)</label>
                <input required minLength={10} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mono" />
                <p className="text-xs text-slate-400 mt-1">The employee will be asked to change this on first login.</p>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {form.role === 'STAFF' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={!!form.permissions[key]}
                        onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [key]: e.target.checked } })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200">
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
                {editing ? 'Save Changes' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {resetResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-semibold text-ink text-base">Password reset for {resetResult.name}</h3>
            <p className="text-sm text-slate-600 mt-2">Share this temporary password with them securely (not by email):</p>
            <div className="mono bg-slate-100 rounded-lg px-3 py-2 mt-3 text-sm">{resetResult.password}</div>
            <button onClick={() => setResetResult(null)} className="mt-4 w-full px-3 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
