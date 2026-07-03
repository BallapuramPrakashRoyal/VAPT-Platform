import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createScan } from '../api/scanApi';

const MODULES = [
  {
    key: 'portScan',
    title: 'Port & Service Scan',
    desc: 'Nmap-based scan of the 100 most common ports with service/version detection.',
  },
  {
    key: 'webVulnScan',
    title: 'Web Vulnerability Scan',
    desc: 'OWASP ZAP spider + active scan for XSS, SQLi, insecure headers, and more.',
  },
  {
    key: 'subdomainEnum',
    title: 'Subdomain & DNS Enumeration',
    desc: 'Certificate-transparency lookup (crt.sh) plus live DNS resolution.',
  },
];

export default function NewScan() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [label, setLabel] = useState('');
  const [modules, setModules] = useState({ portScan: true, webVulnScan: false, subdomainEnum: true });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleModule = (key) => setModules((m) => ({ ...m, [key]: !m[key] }));
  const anyModuleSelected = Object.values(modules).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!target.trim()) return setError('Target is required.');
    if (!anyModuleSelected) return setError('Select at least one scanning module.');
    if (!consent) return setError('You must confirm authorization to scan this target.');

    setSubmitting(true);
    try {
      const scan = await createScan({ target: target.trim(), label: label.trim(), modules, consent: true });
      navigate(`/scans/${scan._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create scan.');
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">New Scan</h1>
        <p className="page-subtitle">
          Only scan systems you own or have explicit written authorization to test. Try{' '}
          <span className="mono">scanme.nmap.org</span> — Nmap's official legal test target.
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="target">Target (hostname or IP)</label>
          <input
            id="target"
            type="text"
            placeholder="scanme.nmap.org"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="label">Label (optional)</label>
          <input
            id="label"
            type="text"
            placeholder="e.g. Staging server audit"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Scanning modules</label>
          {MODULES.map((m) => (
            <label key={m.key} className={`module-option ${modules[m.key] ? 'checked' : ''}`}>
              <input type="checkbox" checked={!!modules[m.key]} onChange={() => toggleModule(m.key)} />
              <div>
                <div className="m-title">{m.title}</div>
                <div className="m-desc">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="field">
          <label className="consent-box" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I confirm I own this target or have explicit written authorization to perform security
              testing against it. Unauthorized scanning may be illegal in your jurisdiction.
            </span>
          </label>
        </div>

        {error && <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Starting scan…' : 'Start Scan'}
        </button>
      </form>
    </div>
  );
}
