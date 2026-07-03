import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listScans } from '../api/scanApi';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    const load = async () => {
      try {
        const data = await listScans();
        setScans(data);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load scans.');
      } finally {
        setLoading(false);
      }
    };
    load();
    interval = setInterval(load, 5000); // live-ish polling for running scans
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Scan Dashboard</h1>
          <p className="page-subtitle">All vulnerability assessments in one place.</p>
        </div>
        <Link to="/new" className="btn btn-primary">+ New Scan</Link>
      </div>

      {error && <div className="card" style={{ borderColor: 'var(--critical)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="empty-state">Loading scans…</div>
      ) : scans.length === 0 ? (
        <div className="card empty-state">
          No scans yet. Start by running your first assessment.
          <div style={{ marginTop: 14 }}>
            <Link to="/new" className="btn btn-primary">Run a scan</Link>
          </div>
        </div>
      ) : (
        <div>
          {scans.map((s) => (
            <Link to={`/scans/${s._id}`} key={s._id} style={{ color: 'inherit' }}>
              <div className="scan-row">
                <div>
                  <div className="scan-target">{s.label || s.target}</div>
                  <div className="scan-meta">
                    {s.target} · {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={s.overallStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
