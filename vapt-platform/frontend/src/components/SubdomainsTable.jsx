export default function SubdomainsTable({ subdomains = [] }) {
  const live = subdomains.filter((s) => s.resolved);
  if (!subdomains.length) return <div className="empty-state">No subdomains found (or scan not run yet).</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>Subdomain</th>
          <th>Status</th>
          <th>Resolved IPs</th>
        </tr>
      </thead>
      <tbody>
        {(live.length ? live : subdomains).map((s) => (
          <tr key={s.subdomain}>
            <td>{s.subdomain}</td>
            <td>{s.resolved ? 'live' : 'not resolving'}</td>
            <td>{s.ipAddresses?.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
