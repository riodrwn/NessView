interface SummaryCardsProps {
  fileName?: string;
  generatedAt?: string;
  totalHosts: number;
  totalFindings: number;
  uniquePlugins: number;
  riskScore: number;
  totalOccurrences: number;
}

const SummaryCards = ({
  fileName,
  generatedAt,
  totalHosts,
  totalFindings,
  uniquePlugins,
  riskScore,
  totalOccurrences
}: SummaryCardsProps) => (
  <section className="panel">
    <div className="summary-grid">
      <div className="summary-card">
        <p className="muted">Total Hosts</p>
        <div className="kpi-row">
          <span className="kpi-value">{totalHosts.toLocaleString()}</span>
          <span className="kpi-icon">🖥️</span>
        </div>
      </div>
      <div className="summary-card">
        <p className="muted">Total Findings</p>
        <div className="kpi-row">
          <span className="kpi-value">{totalFindings.toLocaleString()}</span>
          <span className="kpi-icon">🛡️</span>
        </div>
      </div>
      <div className="summary-card danger">
        <p className="muted">Risk Score</p>
        <div className="kpi-row">
          <span className="kpi-value">{riskScore}</span>
          <span className="pill critical">Critical Risk</span>
        </div>
      </div>
      <div className="summary-card">
        <p className="muted">Total Occurrences</p>
        <div className="kpi-row">
          <span className="kpi-value">{totalOccurrences.toLocaleString()}</span>
          <span className="kpi-icon">📈</span>
        </div>
      </div>
    </div>
  </section>
);

export default SummaryCards;
