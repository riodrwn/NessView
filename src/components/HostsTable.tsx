import { HostSummary } from "../analytics";
import { SeverityLevel, severityLabel, severityOrder } from "../types";

interface Props {
  hosts: HostSummary[];
}

const HostsTable = ({ hosts }: Props) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Hosts</h2>
        <p className="muted">Top hosts with counts by severity.</p>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Host</th>
              <th>IP</th>
              <th>OS</th>
              <th>Total</th>
              {severityOrder.map((level) => (
                <th key={level}>{severityLabel(level)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hosts.map((host) => (
              <tr key={host.name}>
                <td>{host.name}</td>
                <td>{host.ip ?? "—"}</td>
                <td>{host.os ?? "—"}</td>
                <td className="mono">{host.totalFindings}</td>
                {severityOrder.map((level) => (
                  <td className="mono" key={level}>
                    {host.severityTotals[level as SeverityLevel]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {hosts.length === 0 && <p className="muted">No hosts found in this report.</p>}
      </div>
    </section>
  );
};

export default HostsTable;
