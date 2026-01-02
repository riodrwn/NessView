import { useMemo, useState } from "react";
import { PluginSummary } from "../analytics";
import { SeverityLevel, severityLabel } from "../types";
import VulnerabilityRow from "./VulnerabilityRow";
import VulnerabilityCard from "./VulnerabilityCard";

interface Props {
  plugins: PluginSummary[];
  onCopy?: (message: string) => void;
}

const severityOptions: { value: SeverityLevel | "all"; label: string }[] = [
  { value: "all", label: "All Severities" },
  { value: 4, label: "Critical" },
  { value: 3, label: "High" },
  { value: 2, label: "Medium" },
  { value: 1, label: "Low" },
  { value: 0, label: "Info" }
];

const VulnerabilitiesTable = ({ plugins, onCopy }: Props) => {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plugins.filter((plugin) => {
      const matchesQuery =
        !q ||
        plugin.name.toLowerCase().includes(q) ||
        String(plugin.id).toLowerCase().includes(q) ||
        (plugin.description ?? "").toLowerCase().includes(q);
      const matchesSeverity = severity === "all" || plugin.severity === severity;
      return matchesQuery && matchesSeverity;
    });
  }, [plugins, query, severity]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (a.severity !== b.severity) return b.severity - a.severity;
      return b.count - a.count;
    });
    return copy;
  }, [filtered]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Vulnerabilities</h2>
      </div>

      <div className="filter-block">
        <div className="filters">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by plugin name, ID, or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={severity} onChange={(e) => setSeverity(e.target.value === "all" ? "all" : Number(e.target.value) as SeverityLevel)}>
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="vuln-summary-row">
        <div className="metric-card">
          <p className="muted small">Unique Findings</p>
          <strong>{plugins.length}</strong>
        </div>
        {[4, 3, 2, 1, 0].map((level) => {
          const count = plugins.filter((p) => p.severity === level).length;
          return (
            <div key={level} className="metric-card">
              <p className="muted small">{severityLabel(level as SeverityLevel)}</p>
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>

      <div className="vuln-row-list">
        {sorted.map((plugin) => {
          const isExpanded = expandedId === plugin.id;
          return (
            <div key={plugin.id}>
              <VulnerabilityRow
                plugin={plugin}
                expanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : plugin.id)}
              />
              {isExpanded && <VulnerabilityCard plugin={plugin} onCopy={onCopy} />}
            </div>
          );
        })}
        {sorted.length === 0 && <p className="muted">No findings match this filter.</p>}
      </div>
    </section>
  );
};

export default VulnerabilitiesTable;
