import { SeverityBucket, SeverityLevel, severityLabel } from "../types";

interface Props {
  buckets: SeverityBucket[];
  selected: SeverityLevel | null;
  onSelect: (level: SeverityLevel) => void;
}

const SeverityDistribution = ({ buckets, selected, onSelect }: Props) => {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Severity breakdown</h2>
        <div className="legend">
          <span className="muted">Click to filter</span>
          {selected !== null && <span className="pill">Filtering: {severityLabel(selected)}</span>}
        </div>
      </div>
      <div className="severity-grid">
        {buckets.map((bucket) => {
          const width = (bucket.count / max) * 100;
          const isActive = selected === bucket.level;

          return (
            <button
              key={bucket.level}
              className={`severity-card ${isActive ? "active" : ""}`}
              onClick={() => onSelect(bucket.level)}
              style={{ borderColor: bucket.color }}
            >
              <div className="severity-header">
                <span className="pill" style={{ backgroundColor: bucket.color }}>
                  {bucket.label}
                </span>
                <span className="count">{bucket.count.toLocaleString()}</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${width}%`, backgroundColor: bucket.color }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SeverityDistribution;
