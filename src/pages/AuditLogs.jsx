import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';

const ACTIONS = [
  'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED',
  'CREDENTIAL_CREATED', 'CREDENTIAL_UPDATED', 'CREDENTIAL_DELETED', 'PASSWORD_REVEALED',
  'PASSWORD_COPIED', 'CREDENTIAL_FILLED', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED',
  'EMPLOYEE_DEACTIVATED', 'EMPLOYEE_PASSWORD_RESET', 'UNAUTHORIZED_ATTEMPT',
];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      params.set('limit', '200');
      const data = await Api.listAuditLogs(`?${params.toString()}`);
      setLogs(data.logs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Audit Logs</h1>
      <p className="text-sm text-slate-500 mb-6">Every sensitive action, attributed and timestamped. Plaintext passwords are never logged.</p>

      <select value={action} onChange={(e) => setAction(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4">
        <option value="">All actions</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {error && <div className="text-rose-600 text-sm mb-3">{error}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : logs.length === 0 ? (
        <EmptyState title="No matching audit events" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">IP Address</th>
                <th className="text-left px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{log.employee?.name || '—'}</td>
                  <td className="px-4 py-3 mono text-xs text-slate-600">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600">{log.client?.name || '—'}</td>
                  <td className="px-4 py-3 mono text-xs text-slate-500">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${log.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
