import { PluginSummary } from "../analytics";
import { severityLabel, severityOrder } from "../types";

interface Props {
  plugins: PluginSummary[];
}

const UniqueFindings = ({ plugins }: Props) => {
  const bySeverity = severityOrder.map((level) => {
    const items = plugins.filter((p) => p.severity === level);
    const occurrences = items.reduce((sum, p) => sum + p.count, 0);
    return {
      level,
      label: severityLabel(level),
      unique: items.length,
      occurrences
    };
  });

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Unique Findings by Severity</h2>
      </div>
      <div className="severity-cards">
        {bySeverity.map((item) => (
          <div key={item.level} className={`severity-pill severity-${item.level}`}>
            <div className="pill-top">
              <span className="dot" />
              <span>{item.label}</span>
            </div>
            <div className="pill-metrics">
              <strong>{item.unique}</strong>
              <span className="muted small">({item.occurrences} occurrences)</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UniqueFindings;
