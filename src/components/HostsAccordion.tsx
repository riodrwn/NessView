import { useMemo, useState } from "react";
import { NessusHost } from "../types";
import { SeverityLevel, severityLabel, severityOrder } from "../types";

interface Props {
  hosts: NessusHost[];
}

const countSeverity = (host: NessusHost) =>
  severityOrder.reduce<Record<number, number>>((acc, level) => {
    acc[level] = host.items.filter((i) => i.severity === level).length;
    return acc;
  }, {});

const HostsAccordion = ({ hosts }: Props) => {
  const [openHost, setOpenHost] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel | "all">("all");
  const [port, setPort] = useState<string>("all");
  const [service, setService] = useState<string>("all");

  const portOptions = useMemo(() => {
    const ports = new Set<number>();
    hosts.forEach((h) => h.items.forEach((i) => i.port && ports.add(i.port)));
    return Array.from(ports).sort((a, b) => a - b);
  }, [hosts]);

  const serviceOptions = useMemo(() => {
    const services = new Set<string>();
    hosts.forEach((h) =>
      h.items.forEach((i) => {
        if (i.service) services.add(i.service);
      })
    );
    return Array.from(services).sort();
  }, [hosts]);

  const filteredHosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hosts.filter((host) => {
      const matchesQuery =
        !q ||
        host.name.toLowerCase().includes(q) ||
        (host.properties["host-ip"] ?? "").toLowerCase().includes(q) ||
        (host.properties["operating-system"] ?? "").toLowerCase().includes(q);

      const items = host.items;
      const matchesSeverity = severity === "all" || items.some((i) => i.severity === severity);
      const matchesPort = port === "all" || items.some((i) => String(i.port) === port);
      const matchesService = service === "all" || items.some((i) => (i.service ?? "").toLowerCase() === service);

      return matchesQuery && matchesSeverity && matchesPort && matchesService;
    });
  }, [hosts, query, severity, port, service]);

  const sortedHosts = [...filteredHosts].sort((a, b) => b.items.length - a.items.length);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Hosts</h2>
      </div>
      <div className="filter-block">
        <div className="filters">
          <select value={severity} onChange={(e) => setSeverity(e.target.value === "all" ? "all" : Number(e.target.value) as SeverityLevel)}>
            <option value="all">Severity</option>
            {[4, 3, 2, 1, 0].map((lvl) => (
              <option key={lvl} value={lvl}>
                {severityLabel(lvl as SeverityLevel)}
              </option>
            ))}
          </select>
          <select value={port} onChange={(e) => setPort(e.target.value)}>
            <option value="all">All Ports</option>
            {portOptions.map((p) => (
              <option key={p} value={p}>
                Port {p}
              </option>
            ))}
          </select>
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="all">All Services</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by IP, hostname, or OS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="host-list">
        {sortedHosts.map((host) => {
          const isOpen = openHost === host.name;
          const totals = countSeverity(host);
          return (
            <div key={host.name} className="host-card">
              <button className="host-row" onClick={() => setOpenHost(isOpen ? null : host.name)} aria-expanded={isOpen}>
                <div className="host-main">
                  <span className="chevron">{isOpen ? "⌄" : "›"}</span>
                  <div className="host-text">
                    <div className="host-name">{host.name}</div>
                    <div className="host-sub">
                      <span>{host.properties["host-ip"] ?? "IP N/A"}</span>
                      {host.properties["operating-system"] && <span>{host.properties["operating-system"]}</span>}
                    </div>
                    <div className="host-severity-pills">
                      {severityOrder.map((lvl) => (
                        <span key={lvl} className={`pill pill-small sev-${lvl}`}>
                          {severityLabel(lvl)} {totals[lvl] ? totals[lvl] : 0}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="host-meta">
                  <span className="badge">{host.items.length} occurrences</span>
                </div>
              </button>
              {isOpen && (
                <div className="host-details">
                  <h4>Vulnerabilities</h4>
                  <div className="host-vuln-list">
                    {host.items
                      .sort((a, b) => b.severity - a.severity)
                      .map((item) => (
                        <div key={`${item.id}-${item.port ?? ""}-${item.protocol ?? ""}`} className="host-vuln-row">
                          <span className={`pill pill-small sev-${item.severity}`}>{severityLabel(item.severity)}</span>
                          <div className="vuln-row-text">
                            <div className="vuln-row-title">{item.name}</div>
                            <div className="vuln-row-sub">
                              <span className="muted small">{item.id}</span>
                              {item.cve?.length ? <span className="muted small">CVE: {item.cve.slice(0, 2).join(", ")}</span> : null}
                              {item.port ? <span className="muted small">Port {item.port}</span> : null}
                            </div>
                            {item.description && <p className="muted small">{item.description}</p>}
                          </div>
                        </div>
                      ))}
                    {host.items.length === 0 && <p className="muted">No findings for this host.</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HostsAccordion;
