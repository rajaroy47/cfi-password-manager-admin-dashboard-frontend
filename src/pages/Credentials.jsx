// import React, { useEffect, useState } from 'react';
// import { Api } from '../api/client';
// import EmptyState from '../components/EmptyState.jsx';
// import Badge from '../components/Badge.jsx';
// import ConfirmDialog from '../components/ConfirmDialog.jsx';
// import ClientDetail from '../components/ClientDetail.jsx';
// import { useToast } from '../components/Toast.jsx';
// import { useAuth } from '../context/AuthContext.jsx';

// const emptyForm = { client: '', service: '', websiteName: '', websiteUrl: '', username: '', password: '', notes: '' };

// export default function Credentials() {
//   const { hasPermission } = useAuth();
//   const [credentials, setCredentials] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [services, setServices] = useState([]);
//   const [search, setSearch] = useState('');
//   const [clientFilter, setClientFilter] = useState('');
//   const [serviceFilter, setServiceFilter] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(emptyForm);
//   const [revealed, setRevealed] = useState({});
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [viewingClientId, setViewingClientId] = useState(null);
//   const toast = useToast();

//   useEffect(() => {
//     Api.listClients('?limit=500').then((d) => setClients(d.clients));
//     Api.listServices().then((d) => setServices(d.services));
//   }, []);

//   async function load() {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (search) params.set('search', search);
//       if (clientFilter) params.set('client', clientFilter);
//       if (serviceFilter) params.set('service', serviceFilter);
//       params.set('limit', '300');
//       const data = await Api.listCredentials(`?${params.toString()}`);
//       setCredentials(data.credentials);
//     } catch (e) {
//       toast(e.message, 'error');
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     const t = setTimeout(load, 250);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [search, clientFilter, serviceFilter]);

//   function openNew() {
//     setEditing(null);
//     setForm(emptyForm);
//     setShowForm(true);
//   }

//   function openEdit(cred) {
//     setEditing(cred);
//     setForm({
//       client: cred.client?._id || cred.client,
//       service: cred.service?._id || cred.service,
//       websiteName: cred.websiteName,
//       websiteUrl: cred.websiteUrl,
//       username: cred.username,
//       password: '',
//       notes: cred.notes || '',
//     });
//     setShowForm(true);
//   }

//   async function handleSave(e) {
//     e.preventDefault();
//     try {
//       if (editing) {
//         const payload = { ...form };
//         if (!payload.password) delete payload.password; // keep existing password if left blank
//         await Api.updateCredential(editing.id, payload);
//         toast('Login updated');
//       } else {
//         await Api.createCredential(form);
//         toast('✓ Login saved successfully');
//       }
//       setShowForm(false);
//       load();
//     } catch (err) {
//       toast(err.message, 'error');
//     }
//   }

//   async function handleDelete() {
//     try {
//       await Api.deleteCredential(deleteTarget.id);
//       toast('Credential deactivated');
//       setDeleteTarget(null);
//       load();
//     } catch (err) {
//       toast(err.message, 'error');
//       setDeleteTarget(null);
//     }
//   }

//   async function toggleReveal(cred) {
//     if (revealed[cred.id]) {
//       setRevealed((r) => ({ ...r, [cred.id]: undefined }));
//       return;
//     }
//     try {
//       const data = await Api.revealCredential(cred.id);
//       setRevealed((r) => ({ ...r, [cred.id]: data.password }));
//     } catch (err) {
//       toast(err.message, 'error');
//     }
//   }

//   async function copyPassword(cred) {
//     try {
//       const data = await Api.copyCredential(cred.id);
//       await navigator.clipboard.writeText(data.password);
//       toast(`Password copied. Clipboard will be cleared in ${data.clipboardTimeoutSeconds} seconds.`);
//       setTimeout(async () => {
//         const current = await navigator.clipboard.readText().catch(() => null);
//         if (current === data.password) await navigator.clipboard.writeText('');
//       }, data.clipboardTimeoutSeconds * 1000);
//     } catch (err) {
//       toast(err.message, 'error');
//     }
//   }

//   function copyUsername(cred) {
//     navigator.clipboard.writeText(cred.username);
//     toast('Username copied');
//   }

//   const canReveal = hasPermission('canRevealPasswords');
//   const canEdit = hasPermission('canEditCredentials');
//   const canDelete = hasPermission('canDeleteCredentials');
//   const canCreate = hasPermission('canCreateCredentials');

//   credentials.map((cred)=>{
//     console.log("credentials: ", cred)
//   })

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-ink">Credentials</h1>
//           <p className="text-sm text-slate-500">Every client login, one searchable vault.</p>
//         </div>
//         {canCreate && (
//           <button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
//             + Add Login
//           </button>
//         )}
//       </div>

//       <div className="flex flex-wrap gap-3 mb-4">
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="🔍 Search website, username, or client name…"
//           className="w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
//         />
//         <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
//           <option value="">All clients</option>
//           {clients.map((c) => (
//             <option key={c._id} value={c._id}>
//               {c.name}
//             </option>
//           ))}
//         </select>
//         <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
//           <option value="">All services</option>
//           {services.map((s) => (
//             <option key={s._id} value={s._id}>
//               {s.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <div className="text-slate-400 text-sm">Loading…</div>
//       ) : credentials.length === 0 ? (
//         <EmptyState title="No credentials found" hint="Add a login or adjust your filters." />
//       ) : (
//         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 text-xs uppercase text-slate-500">
//               <tr>
//                 <th className="text-left px-4 py-3 font-medium">Client</th>
//                 <th className="text-left px-4 py-3 font-medium">Service</th>
//                 <th className="text-left px-4 py-3 font-medium">Website</th>
//                 <th className="text-left px-4 py-3 font-medium">Username</th>
//                 <th className="text-left px-4 py-3 font-medium">Password</th>
//                 <th className="text-left px-4 py-3 font-medium">Status</th>
//                 <th className="px-4 py-3"></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {credentials.map((cred) => (
//                 <tr key={cred.id} className="hover:bg-slate-50">
//                   <td className="px-4 py-3 font-medium">
//                     {cred.client?._id ? (
//                       <button onClick={() => setViewingClientId(cred.client._id)} className="text-brand-700 hover:underline text-left">
//                         {cred.client.name}
//                       </button>
//                     ) : (
//                       <span className="text-ink">—</span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-slate-600">{cred.service?.name || '—'}</td>
//                   <td className="px-4 py-3">
//                     <a href={`${cred.websiteUrl}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
//                       {cred.websiteName}
//                     </a>
//                     <div className="text-xs text-slate-400">{cred.hostname}</div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className="mono text-slate-700">{cred.username}</span>{' '}
//                     <button onClick={() => copyUsername(cred)} className="text-xs text-slate-400 hover:text-brand-600" title="Copy username">
//                       📋
//                     </button>
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className="mono text-slate-700">{revealed[cred.id] || '••••••••••'}</span>
//                     {canReveal && (
//                       <>
//                         <button onClick={() => toggleReveal(cred)} className="ml-2 text-xs text-slate-400 hover:text-brand-600" title="Show/hide">
//                           👁
//                         </button>
//                         <button onClick={() => copyPassword(cred)} className="ml-1 text-xs text-slate-400 hover:text-brand-600" title="Copy password">
//                           📋
//                         </button>
//                       </>
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     <Badge variant={cred.isActive ? 'active' : 'inactive'}>{cred.isActive ? 'Active' : 'Inactive'}</Badge>
//                   </td>
//                   <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
//                     {canEdit && (
//                       <button onClick={() => openEdit(cred)} className="text-brand-600 hover:underline text-xs font-medium">
//                         Edit
//                       </button>
//                     )}
//                     {canDelete && (
//                       <button onClick={() => setDeleteTarget(cred)} className="text-rose-600 hover:underline text-xs font-medium">
//                         Delete
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//           <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-[480px] shadow-xl max-h-[90vh] overflow-y-auto">
//             <h3 className="font-semibold text-ink text-base mb-4">{editing ? 'Edit Login' : 'Add Login'}</h3>

//             <div className="mb-3">
//               <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
//               <select required value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
//                 <option value="">Select client…</option>
//                 {clients.map((c) => (
//                   <option key={c._id} value={c._id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="mb-3">
//               <label className="block text-xs font-medium text-slate-600 mb-1">Service *</label>
//               <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
//                 <option value="">Select service…</option>
//                 {services.map((s) => (
//                   <option key={s._id} value={s._id}>
//                     {s.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {[
//               ['websiteName', 'Website Name *', 'text'],
//               ['websiteUrl', 'Website URL *', 'text'],
//               ['username', 'Username *', 'text'],
//               ['password', editing ? 'New Password (leave blank to keep current)' : 'Password *', 'text'],
//             ].map(([key, label, type]) => (
//               <div className="mb-3" key={key}>
//                 <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
//                 <input
//                   required={key !== 'password' || !editing}
//                   type={type}
//                   value={form[key] || ''}
//                   onChange={(e) => setForm({ ...form, [key]: e.target.value })}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mono"
//                 />
//               </div>
//             ))}

//             <div className="mb-3">
//               <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
//               <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16" />
//             </div>

//             <div className="flex justify-end gap-2 mt-4">
//               <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200">
//                 Cancel
//               </button>
//               <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
//                 {editing ? 'Save Changes' : 'Save Login'}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       <ConfirmDialog
//         open={!!deleteTarget}
//         title="Deactivate credential?"
//         message="It will be hidden from autofill and search, but preserved in the audit history."
//         onConfirm={handleDelete}
//         onCancel={() => setDeleteTarget(null)}
//         danger
//       />

//       {viewingClientId && <ClientDetail clientId={viewingClientId} onClose={() => setViewingClientId(null)} onChanged={load} />}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { Api } from "../api/client";

import EmptyState from "../components/EmptyState.jsx";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ClientDetail from "../components/ClientDetail.jsx";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  client: "",
  service: "",
  websiteName: "",
  websiteUrl: "",
  username: "",
  password: "",
  notes: "",
};

export default function Credentials() {
  const { hasPermission } = useAuth();

  const [credentials, setCredentials] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  // Admin should see everything by default — including credentials a
  // staff member deactivated — so they can spot and reactivate them
  // without first knowing to switch the filter.
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [revealed, setRevealed] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingClientId, setViewingClientId] = useState(null);

  const toast = useToast();

  /* =========================================================
     PERMISSIONS
     ========================================================= */

  const canReveal = hasPermission("canRevealPasswords");
  const canEdit = hasPermission("canEditCredentials");
  const canDelete = hasPermission("canDeleteCredentials");
  const canCreate = hasPermission("canCreateCredentials");

  /* =========================================================
     LOAD CLIENTS AND SERVICES
     ========================================================= */

  useEffect(() => {
    async function loadFilters() {
      try {
        const [clientData, serviceData] = await Promise.all([
          Api.listClients("?limit=500"),
          Api.listServices(),
        ]);

        setClients(clientData.clients || []);
        setServices(serviceData.services || []);
      } catch (err) {
        toast(err.message || "Unable to load clients and services.", "error");
      }
    }

    loadFilters();
  }, []);

  /* =========================================================
     LOAD CREDENTIALS
     ========================================================= */

  async function load() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (clientFilter) {
        params.set("client", clientFilter);
      }

      if (serviceFilter) {
        params.set("service", serviceFilter);
      }

      // 'active' (default), 'inactive', or 'all' - see listCredentials on
      // the server, which otherwise only ever returns active credentials.
      params.set("status", statusFilter);

      params.set("limit", "300");

      const data = await Api.listCredentials(`?${params.toString()}`);

      setCredentials(data.credentials || []);
    } catch (err) {
      toast(err.message || "Unable to load credentials.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, clientFilter, serviceFilter, statusFilter]);

  /* =========================================================
     ADD NEW CREDENTIAL
     ========================================================= */

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  /* =========================================================
     EDIT CREDENTIAL
     ========================================================= */

  function openEdit(cred) {
    setEditing(cred);

    setForm({
      client: cred.client?._id || cred.client || "",
      service: cred.service?._id || cred.service || "",
      websiteName: cred.websiteName || "",
      websiteUrl: cred.websiteUrl || "",
      username: cred.username || "",
      password: "",
      notes: cred.notes || "",
    });

    setShowForm(true);
  }

  /* =========================================================
     SAVE CREDENTIAL
     ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    try {
      if (editing) {
        const payload = { ...form };

        /*
         * When editing, an empty password means:
         * keep the existing password.
         */

        if (!payload.password) {
          delete payload.password;
        }

        await Api.updateCredential(editing.id, payload);

        toast("Login updated");
      } else {
        await Api.createCredential(form);

        toast("✓ Login saved successfully");
      }

      setShowForm(false);
      load();
    } catch (err) {
      toast(err.message || "Unable to save credential.", "error");
    }
  }

  /* =========================================================
     DELETE CREDENTIAL
     ========================================================= */

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await Api.deleteCredential(deleteTarget.id);

      toast("Credential deactivated");

      setDeleteTarget(null);

      load();
    } catch (err) {
      toast(err.message || "Unable to deactivate credential.", "error");

      setDeleteTarget(null);
    }
  }

  /* =========================================================
     REACTIVATE CREDENTIAL
     ========================================================= */

  async function handleReactivate(cred) {
    try {
      await Api.reactivateCredential(cred.id);

      toast("Credential reactivated");

      load();
    } catch (err) {
      toast(err.message || "Unable to reactivate credential.", "error");
    }
  }

  /* =========================================================
     REVEAL PASSWORD
     ========================================================= */

  async function toggleReveal(cred) {
    if (revealed[cred.id]) {
      setRevealed((previous) => ({
        ...previous,
        [cred.id]: undefined,
      }));

      return;
    }

    try {
      const data = await Api.revealCredential(cred.id);

      setRevealed((previous) => ({
        ...previous,
        [cred.id]: data.password,
      }));
    } catch (err) {
      toast(err.message || "Unable to reveal password.", "error");
    }
  }

  /* =========================================================
     COPY PASSWORD
     ========================================================= */

  async function copyPassword(cred) {
    try {
      const data = await Api.copyCredential(cred.id);

      await navigator.clipboard.writeText(data.password);

      toast(
        `Password copied. Clipboard will be cleared in ${data.clipboardTimeoutSeconds} seconds.`,
      );

      setTimeout(async () => {
        const current = await navigator.clipboard.readText().catch(() => null);

        if (current === data.password) {
          await navigator.clipboard.writeText("");
        }
      }, data.clipboardTimeoutSeconds * 1000);
    } catch (err) {
      toast(err.message || "Unable to copy password.", "error");
    }
  }

  /* =========================================================
     COPY USERNAME
     ========================================================= */

  async function copyUsername(cred) {
    try {
      await navigator.clipboard.writeText(cred.username || "");

      toast("Username copied");
    } catch {
      toast("Unable to copy username.", "error");
    }
  }

  /* =========================================================
     DOWNLOAD CREDENTIALS AS XLSX
     ========================================================= */

  async function downloadCredentialsAsExcel() {
    if (!canReveal) {
      toast("You do not have permission to export passwords.", "error");

      return;
    }

    if (!credentials.length) {
      toast("There are no credentials to export.", "error");

      return;
    }

    const shouldContinue = window.confirm(
      "This export will contain usernames and passwords in an Excel file. Continue?",
    );

    if (!shouldContinue) {
      return;
    }

    setExporting(true);

    try {
      /*
       * Reveal passwords one by one.
       *
       * Do not use Promise.all with a very large number
       * of credentials because it may create too many
       * simultaneous requests.
       */

      const exportedRows = [];

      for (const cred of credentials) {
        let password = "";

        try {
          const revealedData = await Api.revealCredential(cred.id);

          password = revealedData.password || "";
        } catch {
          password = "[Unable to reveal]";
        }

        exportedRows.push({
          Client: cred.client?.name || "",

          Service: cred.service?.name || "",

          Website: cred.websiteUrl || "",

          Username: cred.username || "",

          Password: password,

          Status: cred.isActive ? "Active" : "Inactive",
        });
      }

      /*
       * Convert JSON rows into an Excel worksheet.
       */

      const worksheet = XLSX.utils.json_to_sheet(exportedRows);

      /*
       * Set readable column widths.
       */

      worksheet["!cols"] = [
        { wch: 28 }, // Client
        { wch: 28 }, // Service
        { wch: 45 }, // Website
        { wch: 32 }, // Username
        { wch: 28 }, // Password
        { wch: 14 }, // Status
      ];

      /*
       * Create workbook and append worksheet.
       */

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");

      /*
       * Generate and download XLSX file.
       */

      const date = new Date().toISOString().slice(0, 10);

      XLSX.writeFile(workbook, `company-credentials-${date}.xlsx`);

      toast("Credentials exported successfully.");
    } catch (err) {
      toast(err.message || "Unable to export credentials.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Credentials</h1>

          <p className="text-sm text-slate-500">
            Every client login, one searchable vault.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canReveal && (
            <button
              onClick={downloadCredentialsAsExcel}
              disabled={exporting || loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {exporting ? "Preparing Excel…" : "↓ Download Excel"}
            </button>
          )}

          {canCreate && (
            <button
              onClick={openNew}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + Add Login
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search website, username, or client name…"
          className="w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All clients</option>

          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All services</option>

          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Deactivated only</option>
        </select>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : credentials.length === 0 ? (
        <EmptyState
          title="No credentials found"
          hint="Add a login or adjust your filters."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Client</th>

                <th className="text-left px-4 py-3 font-medium">Service</th>

                <th className="text-left px-4 py-3 font-medium">Website</th>

                <th className="text-left px-4 py-3 font-medium">Username</th>

                <th className="text-left px-4 py-3 font-medium">Password</th>

                <th className="text-left px-4 py-3 font-medium">Status</th>

                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-slate-50">
                  {/* CLIENT */}

                  <td className="px-4 py-3 font-medium">
                    {cred.client?._id ? (
                      <button
                        onClick={() => setViewingClientId(cred.client._id)}
                        className="text-brand-700 hover:underline text-left"
                      >
                        {cred.client.name}
                      </button>
                    ) : (
                      <span className="text-ink">—</span>
                    )}
                  </td>

                  {/* SERVICE */}

                  <td className="px-4 py-3 text-slate-600">
                    {cred.service?.name || "—"}
                  </td>

                  {/* WEBSITE */}

                  <td className="px-4 py-3">
                    <a
                      href={cred.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {cred.websiteName}
                    </a>

                    <div className="text-xs text-slate-400">
                      {cred.hostname}
                    </div>
                  </td>

                  {/* USERNAME */}

                  <td className="px-4 py-3">
                    <span className="mono text-slate-700">{cred.username}</span>

                    <button
                      onClick={() => copyUsername(cred)}
                      className="ml-1 text-xs text-slate-400 hover:text-brand-600"
                      title="Copy username"
                    >
                      📑
                    </button>
                  </td>

                  {/* PASSWORD */}

                  <td className="px-4 py-3">
                    <span className="mono text-slate-700">
                      {revealed[cred.id] || "••••••••••"}
                    </span>

                    {canReveal && (
                      <>
                        <button
                          onClick={() => toggleReveal(cred)}
                          className="ml-2 text-xs text-slate-400 hover:text-brand-600"
                          title="Show/hide password"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => copyPassword(cred)}
                          className="ml-1 text-xs text-slate-400 hover:text-brand-600"
                          title="Copy password"
                        >
                          📑
                        </button>
                      </>
                    )}
                  </td>

                  {/* STATUS */}

                  <td className="px-4 py-3">
                    <Badge variant={cred.isActive ? "active" : "inactive"}>
                      {cred.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  {/* ACTIONS */}

                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {canEdit && (
                      <button
                        onClick={() => openEdit(cred)}
                        className="text-brand-600 hover:underline text-xs font-medium"
                      >
                        Edit
                      </button>
                    )}

                    {canDelete && cred.isActive && (
                      <button
                        onClick={() => setDeleteTarget(cred)}
                        className="text-rose-600 hover:underline text-xs font-medium"
                      >
                        Delete
                      </button>
                    )}

                    {canDelete && !cred.isActive && (
                      <button
                        onClick={() => handleReactivate(cred)}
                        className="text-emerald-600 hover:underline text-xs font-medium"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl p-6 w-[480px] max-w-[95vw] shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-semibold text-ink text-base mb-4">
              {editing ? "Edit Login" : "Add Login"}
            </h3>

            {/* CLIENT */}

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Client *
              </label>

              <select
                required
                value={form.client}
                onChange={(e) =>
                  setForm({
                    ...form,
                    client: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Select client…</option>

                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SERVICE */}

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Service *
              </label>

              <select
                required
                value={form.service}
                onChange={(e) =>
                  setForm({
                    ...form,
                    service: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Select service…</option>

                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TEXT FIELDS */}

            {[
              ["websiteName", "Website Name *", "text"],
              ["websiteUrl", "Website URL *", "url"],
              ["username", "Username *", "text"],
              [
                "password",
                editing
                  ? "New Password (leave blank to keep current)"
                  : "Password *",
                "password",
              ],
            ].map(([key, label, type]) => (
              <div className="mb-3" key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {label}
                </label>

                <input
                  required={key !== "password" || !editing}
                  type={type}
                  value={form[key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mono"
                />
              </div>
            ))}

            {/* NOTES */}

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notes
              </label>

              <textarea
                value={form.notes || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16"
              />
            </div>

            {/* FORM BUTTONS */}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white"
              >
                {editing ? "Save Changes" : "Save Login"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate credential?"
        message="It will be hidden from autofill and search, but preserved in the audit history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      {/* =====================================================
          CLIENT DETAIL
      ===================================================== */}

      {viewingClientId && (
        <ClientDetail
          clientId={viewingClientId}
          onClose={() => setViewingClientId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
