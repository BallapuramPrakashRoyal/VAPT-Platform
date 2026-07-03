export default function StatusBadge({ status }) {
  const label = status || 'pending';
  return (
    <span className={`badge badge-${label}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
