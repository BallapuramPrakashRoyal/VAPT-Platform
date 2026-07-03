import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getScan, deleteScan } from '../api/scanApi';
import StatusBadge from '../components/StatusBadge';
import SeverityChart from '../components/SeverityChart';
import PortsTable from '../components/PortsTable';
import SubdomainsTable from '../components/SubdomainsTable';
import VulnTable from '../components/VulnTable';

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    const load = async () => {
      try {
        const data = await getScan(id);
        setScan(data);
        if (['completed', 'failed', 'partial'].includes(data.overallStatus)) {
          clearInterval(interval);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load scan.');
        clearInterval(interval);
      }
    };
    load();
    interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this scan permanently?')) return;
    await deleteScan(id);
    navigate('/');
  };

  if (error) return <div className="container"><div className="card" style={{ borderColor: 'var(--critical)' }}>{error}</div></div>;
  if (!scan) return <div className="container empty-state">Loading…</div>;

  const { moduleStatus, results, summary, modules } = scan;

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>&larr; All scans</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>{scan.label || scan.target}</h1>
          <p className="page-subtitle mono">{scan.target}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={scan.overallStatus} />
          <button className="btn" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-value">{summary?.totalOpenPorts ?? 0}</div>
          <div className="stat-label">Open Ports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.totalSubdomainsFound ?? 0}</div>
          <div className="stat-label">Live Subdomains</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.totalVulnerabilities ?? 0}</div>
          <div className="stat-label">Vulnerabilities</div>
        </div>
      </div>

      <h2 className="section-title">Severity Breakdown</h2>
      <div className="card">
        <SeverityChart severityCounts={summary?.severityCounts} />
      </div>

      {modules?.portScan && (
        <>
          <h2 className="section-title">
            Open Ports <StatusBadge status={moduleStatus?.portScan?.status} />
          </h2>
          <div className="card">
            {moduleStatus?.portScan?.error && (
              <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 10 }}>
                {moduleStatus.portScan.error}
              </div>
            )}
            <PortsTable ports={results?.ports} />
          </div>
        </>
      )}

      {modules?.subdomainEnum && (
        <>
          <h2 className="section-title">
            Subdomains <StatusBadge status={moduleStatus?.subdomainEnum?.status} />
          </h2>
          <div className="card">
            {moduleStatus?.subdomainEnum?.error && (
              <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 10 }}>
                {moduleStatus.subdomainEnum.error}
              </div>
            )}
            <SubdomainsTable subdomains={results?.subdomains} />
          </div>
        </>
      )}

      {modules?.webVulnScan && (
        <>
          <h2 className="section-title">
            Web Vulnerabilities <StatusBadge status={moduleStatus?.webVulnScan?.status} />
          </h2>
          <div className="card">
            {moduleStatus?.webVulnScan?.error && (
              <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 10 }}>
                {moduleStatus.webVulnScan.error}
              </div>
            )}
            <VulnTable vulnerabilities={results?.vulnerabilities} />
          </div>
        </>
      )}
    </div>
  );
}
