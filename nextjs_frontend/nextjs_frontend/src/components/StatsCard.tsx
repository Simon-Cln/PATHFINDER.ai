interface StatsCardProps {
  label: string;
  value: string | number;
  caption: string;
}

export default function StatsCard({ label, value, caption }: StatsCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="caption">{caption}</span>
    </div>
  );
}
