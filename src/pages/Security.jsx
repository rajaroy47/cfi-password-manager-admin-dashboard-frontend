import React from 'react';

const ITEMS = [
  { title: 'Encryption at rest', body: 'Every website password is encrypted with AES-256-GCM before it touches MongoDB. The master key lives only in the server\'s environment variables — never in the database, the extension, or the dashboard.' },
  { title: 'Employee login security', body: 'Employee passwords are hashed with Argon2id. Access tokens are short-lived JWTs; refresh tokens are stored hashed and rotate on every use.' },
  { title: 'Least-privilege access', body: 'Every sensitive action (reveal, copy, delete, employee management) is enforced server-side against the signed-in employee\'s permissions — never trusted from the client alone.' },
  { title: 'Full audit trail', body: 'Logins, reveals, copies, autofills, and all CRUD actions are recorded with employee, timestamp, IP, and user agent. Plaintext passwords are never written to logs.' },
  { title: 'Origin-based matching', body: 'The extension matches saved logins to a site by hostname/origin, not loose URL string matching, to avoid autofilling into a lookalike or unrelated domain.' },
  { title: 'No plaintext in transit to the extension', body: 'The Chrome extension only ever receives decrypted passwords for a single, explicit, audited reveal/copy/fill action — list and search responses never include them.' },
];

export default function Security() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Security</h1>
      <p className="text-sm text-slate-500 mb-6">How this system protects your clients' credentials.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="font-semibold text-ink text-sm mb-1.5">{item.title}</div>
            <div className="text-sm text-slate-600 leading-relaxed">{item.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        For full technical details, see <span className="mono">SECURITY.md</span> in the project root, including deployment hardening, backup strategy, and incident-response notes.
      </div>
    </div>
  );
}
