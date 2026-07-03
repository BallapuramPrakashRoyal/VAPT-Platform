import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  Critical: '#f85149',
  High: '#ff8c42',
  Medium: '#e3b341',
  Low: '#58a6ff',
  Informational: '#8b98a5',
};

export default function SeverityChart({ severityCounts }) {
  const data = Object.entries(severityCounts || {}).map(([name, value]) => ({ name, value }));
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return <div className="empty-state">No vulnerability data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#8b98a5', fontSize: 12, fontFamily: 'JetBrains Mono' }}
          axisLine={{ stroke: '#22303c' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#8b98a5', fontSize: 12, fontFamily: 'JetBrains Mono' }}
          axisLine={{ stroke: '#22303c' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#121820',
            border: '1px solid #22303c',
            borderRadius: 8,
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
          }}
          cursor={{ fill: 'rgba(79,209,197,0.06)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#8b98a5'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
