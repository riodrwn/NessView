import { SeverityBucket, SeverityLevel, severityLabel } from "../types";

interface Props {
  buckets: SeverityBucket[];
  percents: { level: SeverityLevel; percent: number }[];
  selected: SeverityLevel | null;
  onSelect: (level: SeverityLevel) => void;
}

const colorFor = (level: SeverityLevel) => {
  switch (level) {
    case 4:
      return "#ef4444";
    case 3:
      return "#f97316";
    case 2:
      return "#facc15";
    case 1:
      return "#0ea5e9";
    default:
      return "#22c55e";
  }
};

const DashboardCharts = ({ buckets, percents, selected, onSelect }: Props) => {
  const total = buckets.reduce((sum, b) => sum + b.count, 0) || 1;
  const pieStops = percents
    .sort((a, b) => b.level - a.level)
    .reduce<{ from: number; gradients: string[] }>(
      (acc, item) => {
        const deg = (item.percent / 100) * 360;
        const to = acc.from + deg;
        acc.gradients.push(`${colorFor(item.level)} ${acc.from}deg ${to}deg`);
        acc.from = to;
        return acc;
      },
      { from: 0, gradients: [] }
    ).gradients
    .join(", ");

  return (
    <div className="grid two-columns">
      <section className="panel">
        <div className="panel-header">
          <h3 className="subheading">Summary Vulnerability</h3>
        </div>
        <div className="chart-pie center-content">
          <div className="pie" style={{ backgroundImage: `conic-gradient(${pieStops})` }} />
          <div className="legend-list">
            {percents.map((item) => (
              <button
                key={item.level}
                className={`legend-item ${selected === item.level ? "active" : ""}`}
                onClick={() => onSelect(item.level)}
              >
                <span className="dot" style={{ backgroundColor: colorFor(item.level) }} />
                <span className="label">
                  {severityLabel(item.level)}: {item.percent.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="subheading">Vulnerabilities by Severity</h3>
        </div>
        <div className="chart-bars">
          {buckets.map((bucket) => {
            const height = total ? (bucket.count / total) * 100 : 0;
            const isActive = selected === bucket.level;
            return (
              <button
                key={bucket.level}
                className={`bar-col ${isActive ? "active" : ""}`}
                onClick={() => onSelect(bucket.level)}
              >
                <div
                  className="bar-fill"
                  style={{ height: `${height}%`, backgroundColor: colorFor(bucket.level) }}
                />
                <span className="bar-label">{severityLabel(bucket.level)}</span>
                <span className="bar-count">{bucket.count}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DashboardCharts;
