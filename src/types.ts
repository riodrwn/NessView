export type SeverityLevel = 0 | 1 | 2 | 3 | 4;

export interface NessusReportItem {
  id: string;
  name: string;
  family: string;
  severity: SeverityLevel;
  risk?: string;
  description?: string;
  solution?: string;
  protocol?: string;
  port?: number;
  service?: string;
  synopsis?: string;
  cve?: string[];
  pluginOutput?: string;
  seeAlso?: string[];
}

export interface NessusHost {
  name: string;
  properties: Record<string, string>;
  items: NessusReportItem[];
}

export interface ParsedReport {
  name: string;
  hosts: NessusHost[];
  generatedAt?: string;
}

export interface SeverityBucket {
  level: SeverityLevel;
  label: string;
  color: string;
  count: number;
}

export const severityScale: SeverityBucket[] = [
  { level: 4, label: "Critical", color: "#b91c1c", count: 0 },
  { level: 3, label: "High", color: "#dc2626", count: 0 },
  { level: 2, label: "Medium", color: "#ea580c", count: 0 },
  { level: 1, label: "Low", color: "#0ea5e9", count: 0 },
  { level: 0, label: "Info", color: "#22c55e", count: 0 }
];

export const severityOrder: SeverityLevel[] = [4, 3, 2, 1, 0];

export const severityLabel = (level: SeverityLevel): string =>
  severityScale.find((bucket) => bucket.level === level)?.label ?? "Unknown";
