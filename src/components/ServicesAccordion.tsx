import { useMemo, useState } from "react";
import { NessusHost, NessusReportItem, SeverityLevel, severityLabel, severityOrder } from "../types";

interface Props {
  hosts: NessusHost[];
}

interface ServiceHostEntry {
  hostName: string;
  ip?: string;
  os?: string;
  items: NessusReportItem[];
}

interface ServiceAggregate {
  key: string;
  port: number | null;
  protocol: string;
  name: string;
  occurrences: number;
  hostCount: number;
  hosts: ServiceHostEntry[];
}

const topSeverity = (items: NessusReportItem[]): SeverityLevel => {
  const max = items.reduce((m, i) => Math.max(m, i.severity), 0);
  return Math.min(4, Math.max(0, max)) as SeverityLevel;
};

const buildServices = (hosts: NessusHost[]): ServiceAggregate[] => {
  const map = new Map<
    string,
    {
      port: number | null;
      protocol: string;
      name: string;
      occurrences: number;
      hostMap: Map<string, ServiceHostEntry>;
    }
  >();

  hosts.forEach((host) => {
    host.items.forEach((item) => {
      const port = item.port ?? null;
      const protocol = (item.protocol ?? "tcp").toLowerCase();
      const name = item.service ?? "unknown";
      const key = `${protocol}-${port ?? "na"}-${name.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          port,
          protocol,
          name,
          occurrences: 0,
          hostMap: new Map<string, ServiceHostEntry>()
        });
      }

      const agg = map.get(key)!;
      agg.occurrences += 1;

      const hostEntry =
        agg.hostMap.get(host.name) ??
        {
          hostName: host.name,
          ip: host.properties["host-ip"],
          os: host.properties["operating-system"],
          items: []
        };

      hostEntry.items.push(item);
      agg.hostMap.set(host.name, hostEntry);
    });
  });

  return Array.from(map.values()).map((agg) => ({
    key: `${agg.protocol}-${agg.port ?? "na"}-${agg.name}`,
    port: agg.port,
    protocol: agg.protocol,
    name: agg.name,
    occurrences: agg.occurrences,
    hostCount: agg.hostMap.size,
    hosts: Array.from(agg.hostMap.values())
  }));
};

const ServicesAccordion = ({ hosts }: Props) => {
  const [query, setQuery] = useState("");
  const [protocol, setProtocol] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const services = useMemo(() => buildServices(hosts), [hosts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((svc) => {
      const matchesProtocol = protocol === "all" || svc.protocol === protocol;
      const matchesQuery =
        !q ||
        svc.name.toLowerCase().includes(q) ||
        (svc.port !== null && String(svc.port).includes(q)) ||
        svc.protocol.toLowerCase().includes(q);
      return matchesProtocol && matchesQuery;
    });
  }, [services, protocol, query]);

  const uniqueHosts = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((svc) => svc.hosts.forEach((h) => set.add(h.hostName)));
    return set.size;
  }, [filtered]);

  const stats = {
    uniqueServices: filtered.length,
    affectedHosts: uniqueHosts,
    totalOccurrences: filtered.reduce((sum, s) => sum + s.occurrences, 0),
    servicesWithFindings: filtered.length
  };

  const sorted = [...filtered].sort((a, b) => b.occurrences - a.occurrences);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Services</h2>
      </div>

      <div className="filter-block">
        <div className="filters">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by port, protocol, or service..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            <option value="all">All Protocols</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>
        </div>
      </div>

      <div className="vuln-summary-row">
        <div className="metric-card">
          <p className="muted small">Unique Services</p>
          <strong>{stats.uniqueServices}</strong>
        </div>
        <div className="metric-card">
          <p className="muted small">Affected Hosts</p>
          <strong>{stats.affectedHosts}</strong>
        </div>
        <div className="metric-card">
          <p className="muted small">Total Occurrences</p>
          <strong>{stats.totalOccurrences}</strong>
        </div>
        <div className="metric-card">
          <p className="muted small">Services with Vulns</p>
          <strong>{stats.servicesWithFindings}</strong>
        </div>
      </div>

      <div className="service-list">
        {sorted.map((svc) => {
          const isOpen = expanded === svc.key;
          return (
            <div key={svc.key} className="service-card">
              <button className="service-row" onClick={() => setExpanded(isOpen ? null : svc.key)} aria-expanded={isOpen}>
                <div className="service-main">
                  <span className="chevron">{isOpen ? "⌄" : "›"}</span>
                  <div className="service-port">
                    <span className="pill pill-small">{svc.protocol.toUpperCase()}</span>
                    <span className="pill pill-small">{svc.port ?? "n/a"}</span>
                  </div>
                  <div className="service-text">
                    <div className="service-name">{svc.name}</div>
                  </div>
                </div>
                <div className="service-meta">
                  <span className="badge">{svc.hostCount} hosts</span>
                  <span className="badge">{svc.occurrences} occurrences</span>
                </div>
              </button>
              {isOpen && (
                <div className="service-details">
                  <h4>Hosts with {svc.protocol.toUpperCase()}/{svc.port ?? "n/a"} {svc.name}</h4>
                  <div className="service-host-list">
                    {svc.hosts.map((host) => {
                      const sev = topSeverity(host.items);
                      return (
                        <div key={host.hostName} className="service-host-row">
                          <div className="service-host-main">
                            <span className={`pill pill-small sev-${sev}`}>{severityLabel(sev)}</span>
                            <div className="service-host-text">
                              <div className="service-host-name">{host.hostName}</div>
                              <div className="service-host-sub">
                                {host.ip && <span>{host.ip}</span>}
                                {host.os && <span>{host.os}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="badge">{host.items.length} findings</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && <p className="muted">No services match this filter.</p>}
      </div>
    </section>
  );
};

export default ServicesAccordion;
