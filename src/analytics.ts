import { NessusHost, SeverityBucket, SeverityLevel, severityOrder, severityScale } from "./types";

export interface HostSummary {
  name: string;
  ip?: string;
  os?: string;
  totalFindings: number;
  severityTotals: Record<SeverityLevel, number>;
}

export interface PluginSummary {
  id: string;
  name: string;
  family: string;
  severity: SeverityLevel;
  count: number;
  hostCount: number;
  hosts: string[];
  description?: string;
  solution?: string;
  synopsis?: string;
  risk?: string;
  cve?: string[];
  seeAlso?: string[];
  pluginOutput?: string;
}

export interface SeverityPercent {
  level: SeverityLevel;
  percent: number;
}

export const cloneSeverityScale = (): SeverityBucket[] =>
  severityScale.map((bucket) => ({ ...bucket }));

export const tallySeverity = (hosts: NessusHost[]): SeverityBucket[] => {
  const buckets = cloneSeverityScale();
  const counts = Object.fromEntries(severityOrder.map((level) => [level, 0])) as Record<SeverityLevel, number>;

  hosts.forEach((host) => {
    host.items.forEach((item) => {
      counts[item.severity] += 1;
    });
  });

  return buckets.map((bucket) => ({ ...bucket, count: counts[bucket.level] ?? 0 }));
};

export const summarizeHosts = (hosts: NessusHost[]): HostSummary[] =>
  hosts.map((host) => {
    const severityTotals = Object.fromEntries(severityOrder.map((level) => [level, 0])) as Record<SeverityLevel, number>;
    host.items.forEach((item) => {
      severityTotals[item.severity] += 1;
    });

    return {
      name: host.name,
      ip: host.properties["host-ip"] ?? host.properties["HOST_END"],
      os: host.properties["operating-system"],
      totalFindings: host.items.length,
      severityTotals
    };
  });

export const summarizePlugins = (hosts: NessusHost[]): PluginSummary[] => {
  const map = new Map<
    string,
    PluginSummary & {
      hostSet: Set<string>;
    }
  >();

  hosts.forEach((host) => {
    host.items.forEach((item) => {
      const existing = map.get(item.id);
      if (existing) {
        existing.count += 1;
        existing.severity = Math.max(existing.severity, item.severity) as SeverityLevel;
        existing.hostSet.add(host.name);
        return;
      }

      map.set(item.id, {
        id: item.id,
        name: item.name,
        family: item.family,
        severity: item.severity,
        count: 1,
        hostCount: 0,
        hosts: [],
        description: item.description,
        solution: item.solution,
        synopsis: item.synopsis,
        risk: item.risk,
        cve: item.cve,
        seeAlso: item.seeAlso,
        pluginOutput: item.pluginOutput,
        hostSet: new Set<string>([host.name])
      });
    });
  });

  return Array.from(map.values()).map((item) => ({
    id: item.id,
    name: item.name,
    family: item.family,
    severity: item.severity,
    count: item.count,
    hostCount: item.hostSet.size,
    hosts: Array.from(item.hostSet),
    description: item.description,
    solution: item.solution,
    synopsis: item.synopsis,
    risk: item.risk,
    cve: item.cve,
    seeAlso: item.seeAlso,
    pluginOutput: item.pluginOutput
  }));
};

export const overallTotals = (hosts: NessusHost[]) => {
  const severityBuckets = tallySeverity(hosts);
  const totalFindings = severityBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const uniquePlugins = new Set<string>();
  hosts.forEach((host) => host.items.forEach((item) => uniquePlugins.add(item.id)));

  return {
    totalHosts: hosts.length,
    totalFindings,
    uniquePlugins: uniquePlugins.size,
    severityBuckets
  };
};

export const severityPercents = (buckets: SeverityBucket[]): SeverityPercent[] => {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0) || 1;
  return buckets.map((bucket) => ({
    level: bucket.level,
    percent: (bucket.count / total) * 100
  }));
};

export const riskScore = (buckets: SeverityBucket[]): number => {
  const weights: Record<SeverityLevel, number> = {
    4: 100,
    3: 80,
    2: 55,
    1: 30,
    0: 5
  };
  const totalFindings = buckets.reduce((sum, b) => sum + b.count, 0);
  if (!totalFindings) return 0;

  const weighted = buckets.reduce((sum, bucket) => sum + bucket.count * weights[bucket.level], 0);
  return Math.min(100, Math.round(weighted / totalFindings));
};

export const occurrencesCsvRows = (hosts: NessusHost[]) => {
  const rows: Record<string, string | number | undefined>[] = [];
  hosts.forEach((host) => {
    host.items.forEach((item) => {
      rows.push({
        host: host.name,
        ip: host.properties["host-ip"],
        pluginId: item.id,
        pluginName: item.name,
        severity: item.severity,
        risk: item.risk,
        port: item.port,
        protocol: item.protocol,
        service: item.service,
        description: item.description
      });
    });
  });
  return rows;
};

export const findingsCsvRows = (plugins: PluginSummary[]) =>
  plugins.map((p) => ({
    pluginId: p.id,
    pluginName: p.name,
    family: p.family,
    severity: p.severity,
    occurrences: p.count,
    hostCount: p.hostCount
  }));
