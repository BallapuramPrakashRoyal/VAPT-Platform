const ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 };

export default function VulnTable({ vulnerabilities = [] }) {
  if (!vulnerabilities.length)
    return <div className="empty-state">No vulnerabilities found (or scan not run yet).</div>;

  const sorted = [...vulnerabilities].sort((a, b) => ORDER[a.riskLevel] - ORDER[b.riskLevel]);

  return (
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Vulnerability</th>
          <th>URL</th>
          <th>Param</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((v, i) => (
          <tr key={i}>
            <td><span className={`sev-badge sev-${v.riskLevel}`}>{v.riskLevel}</span></td>
            <td title={v.description}>{v.name}</td>
            <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.url}
            </td>
            <td>{v.param || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
