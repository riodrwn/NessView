import { HostSummary } from "../analytics";

interface Props {
  hosts: HostSummary[];
}

const ScanReports = ({ hosts }: Props) => (
  <section className="panel">
    <div className="panel-header">
      <h2>Scan Reports</h2>
    </div>
    <div className="scan-list">
      {hosts.map((host) => (
        <div key={host.name} className="scan-item">
          <div className="scan-title">{host.name}</div>
          <div className="scan-meta">
            <span>IP: {host.ip ?? "N/A"}</span>
            <span>Findings: {host.totalFindings}</span>
          </div>
        </div>
      ))}
      {hosts.length === 0 && <p className="muted">No hosts available.</p>}
    </div>
  </section>
);

export default ScanReports;
