export default function PortsTable({ ports = [] }) {
  if (!ports.length) return <div className="empty-state">No open ports found (or scan not run yet).</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>Port</th>
          <th>Protocol</th>
          <th>State</th>
          <th>Service</th>
          <th>Product / Version</th>
        </tr>
      </thead>
      <tbody>
        {ports.map((p) => (
          <tr key={`${p.port}-${p.protocol}`}>
            <td>{p.port}</td>
            <td>{p.protocol}</td>
            <td>{p.state}</td>
            <td>{p.service}</td>
            <td>{[p.product, p.version].filter(Boolean).join(' ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
