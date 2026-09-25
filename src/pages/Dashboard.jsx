import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

const ACTION_LABELS = {
  LOGIN: 'signed in',
  LOGOUT: 'signed out',
  CLIENT_CREATED: 'created a client',
  CLIENT_UPDATED: 'updated a client',
  CLIENT_DELETED: 'deleted a client',
  CREDENTIAL_CREATED: 'saved a new login',
  CREDENTIAL_UPDATED: 'updated a login',
  CREDENTIAL_DELETED: 'deactivated a login',
  PASSWORD_REVEALED: 'revealed a password',
  PASSWORD_COPIED: 'copied a password',
  CREDENTIAL_FILLED: 'autofilled a login',
  WEBSITE_OPENED: 'opened a website',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Api.getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-rose-600 text-sm">{error}</div>;
  if (!stats) return <div className="text-slate-400 text-sm">Loading dashboard…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Dashboard Stats.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Clients" value={stats.totalClients} />
        <StatCard label="Total Credentials" value={stats.totalCredentials} accent="green" />
        <StatCard label="Active Employees" value={stats.activeEmployees} accent="slate" />
        <StatCard label="Added Today" value={stats.credentialsAddedToday} accent="amber" hint={`${stats.credentialsUpdatedToday} updated today`} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-sm text-ink">Recent Activity</div>
        <div className="divide-y divide-slate-100">
          {(!stats.recentActivity || stats.recentActivity.length === 0) && (
            <div className="p-5">
              <EmptyState title="No activity yet" hint="Actions across the office will show up here." />
            </div>
          )}
          {stats.recentActivity?.map((log) => (
            <div key={log._id} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-ink">{log.employee?.name || 'Unknown'}</span>{' '}
                <span className="text-slate-500">{ACTION_LABELS[log.action] || log.action.toLowerCase()}</span>
                {log.client?.name && <span className="text-slate-400"> · {log.client.name}</span>}
              </div>
              <div className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
