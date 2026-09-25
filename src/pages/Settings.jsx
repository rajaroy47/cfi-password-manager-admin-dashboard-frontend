import React, { useState } from 'react';
import { Api } from '../api/client';
import { useToast } from '../components/Toast.jsx';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(Api.getApiBaseUrl());
  const toast = useToast();

  function save() {
    const trimmed = apiUrl.trim().replace(/\/$/, '');
    if (!/^https?:\/\//.test(trimmed)) {
      toast('Enter a valid URL starting with http:// or https://', 'error');
      return;
    }
    Api.setApiBaseUrl(trimmed);
    toast('API URL saved. Reload the page to apply it everywhere.');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-6">Office Private Server URI</p>

      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-lg">
        <label className="block text-xs font-medium text-slate-600 mb-1">Backend API URL</label>
        <input
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://192.168.1.100:4000"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mono"
        />
        
        <button onClick={save} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          Save
        </button>
      </div>
    </div>
  );
}
