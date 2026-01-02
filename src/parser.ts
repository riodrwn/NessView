import { XMLParser } from "fast-xml-parser";
import { NessusHost, NessusReportItem, ParsedReport, SeverityLevel } from "./types";

const arrayPaths = new Set([
  "NessusClientData_v2.Report.ReportHost",
  "NessusClientData_v2.Report.ReportHost.ReportItem",
  "nessusClientData_v2.Report.ReportHost",
  "nessusClientData_v2.Report.ReportHost.ReportItem"
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  trimValues: true,
  allowBooleanAttributes: true,
  isArray: (name, jpath) => arrayPaths.has(jpath)
});

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const normalizeSeverity = (value: unknown): SeverityLevel => {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }
  if (numeric > 4) {
    return 4;
  }
  return numeric as SeverityLevel;
};

const parseProperties = (hostNode: any): Record<string, string> => {
  const properties: Record<string, string> = {};
  const tags = toArray(hostNode?.HostProperties?.tag);

  tags.forEach((tag) => {
    const key = tag?.["@_name"];
    const value = tag?.["#text"] ?? tag?.text ?? "";
    if (key) {
      properties[key] = typeof value === "string" ? value : String(value);
    }
  });

  return properties;
};

const stringifyValue = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return typeof value === "string" ? value : String(value);
};

const parseReportItem = (node: any): NessusReportItem => {
  const severity = normalizeSeverity(node?.["@_severity"]);
  const cves = toArray(node?.cve).filter(Boolean) as string[];
  const seeAlso = toArray(node?.see_also).filter(Boolean) as string[];
  const fallbackId = `generated-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: String(node?.["@_pluginID"] ?? node?.["@_pluginName"] ?? fallbackId),
    name: node?.["@_pluginName"] ?? "Unknown plugin",
    family: node?.["@_pluginFamily"] ?? "Unknown family",
    severity,
    risk: node?.risk_factor,
    description: node?.description,
    solution: node?.solution,
    protocol: node?.["@_protocol"],
    port: node?.["@_port"] ? Number(node?.["@_port"]) : undefined,
    service: node?.svc_name ?? node?.["@_svc_name"],
    synopsis: node?.synopsis,
    cve: cves.length ? cves : undefined,
    pluginOutput: node?.plugin_output,
    seeAlso: seeAlso.length ? seeAlso : undefined
  };
};

const parseReportHost = (hostNode: any): NessusHost => {
  const items = toArray(hostNode?.ReportItem).map(parseReportItem);

  return {
    name: hostNode?.["@_name"] ?? "Unknown host",
    properties: parseProperties(hostNode),
    items
  };
};

export const parseNessusXml = (xml: string): ParsedReport => {
  const parsed = parser.parse(xml);
  const root = parsed?.NessusClientData_v2 ?? parsed?.nessusClientData_v2;

  if (!root?.Report) {
    throw new Error("File does not look like a Nessus report");
  }

  const report = root.Report;
  const hosts = toArray(report?.ReportHost).map(parseReportHost);

  return {
    name: report?.["@_name"] ?? "Nessus Report",
    hosts,
    generatedAt: root?.Policy?.timestamp ?? root?.Policy?.policyName
  };
};

export const parseNessusJson = (json: string): ParsedReport => {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("File is not valid JSON");
  }

  const data = parsed?.data;
  if (!data?.hosts || !data?.instances || !data?.findings) {
    throw new Error("JSON file does not look like a Nessus export");
  }

  const findings = Array.isArray(data.findings) ? data.findings : [];
  const findingMap = new Map<string, any>();
  findings.forEach((finding) => {
    const key = finding?.pluginId ?? finding?.id;
    if (key !== undefined && key !== null) {
      findingMap.set(String(key), finding);
    }
  });

  const instancesByHost = new Map<string, any[]>();
  const instances = Array.isArray(data.instances) ? data.instances : [];
  instances.forEach((instance) => {
    const hostId = instance?.hostId ?? instance?.host ?? instance?.assetId ?? instance?.target;
    if (!hostId) return;
    const key = String(hostId);
    if (!instancesByHost.has(key)) {
      instancesByHost.set(key, []);
    }
    instancesByHost.get(key)!.push(instance);
  });

  const parseJsonProperties = (hostNode: any): Record<string, string> => {
    const properties: Record<string, string> = {};
    const tags = hostNode?.tags;

    if (tags && typeof tags === "object") {
      Object.entries(tags).forEach(([key, value]) => {
        const str = stringifyValue(value);
        if (str !== undefined) {
          properties[key] = str;
        }
      });
    }

    const ip = stringifyValue(hostNode?.ip ?? hostNode?.id);
    const fqdn = stringifyValue(hostNode?.hostname ?? hostNode?.fqdn);
    const os = stringifyValue(hostNode?.os);
    if (ip) properties["host-ip"] = ip;
    if (fqdn) properties["host-fqdn"] = fqdn;
    if (os) properties["operating-system"] = os;

    return properties;
  };

  const hosts = toArray(data.hosts).map((hostNode) => {
    const hostId = hostNode?.id ?? hostNode?.ip ?? hostNode?.hostname;
    const instancesForHost = hostId ? instancesByHost.get(String(hostId)) ?? [] : [];
    const properties = parseJsonProperties(hostNode);
    const items: NessusReportItem[] = [];
    const seen = new Set<string>();

    instancesForHost.forEach((instance) => {
      const pluginKey = instance?.pluginId ?? instance?.id;
      if (!pluginKey) return;

      const dedupeKey = `${pluginKey}|${instance?.protocol ?? ""}|${instance?.port ?? ""}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const finding = findingMap.get(String(pluginKey)) ?? {};
      const cveList = toArray(finding?.cve).filter(Boolean) as string[];
      const seeAlsoList = toArray(finding?.seeAlso).filter(Boolean) as string[];

      items.push({
        id: String(finding?.pluginId ?? finding?.id ?? pluginKey),
        name: finding?.name ?? "Unknown plugin",
        family: finding?.family ?? "Unknown family",
        severity: normalizeSeverity(finding?.severity),
        risk: finding?.riskFactor ?? finding?.risk,
        description: finding?.description,
        solution: finding?.solution,
        protocol: instance?.protocol,
        port: instance?.port !== undefined && instance?.port !== null ? Number(instance.port) : undefined,
        service: instance?.svcName ?? instance?.service,
        synopsis: finding?.synopsis,
        cve: cveList.length ? cveList : undefined,
        pluginOutput: instance?.pluginOutput ?? finding?.pluginOutput,
        seeAlso: seeAlsoList.length ? seeAlsoList : undefined
      });
    });

    return {
      name: hostNode?.hostname ?? hostNode?.ip ?? hostNode?.id ?? "Unknown host",
      properties,
      items
    };
  });

  if (!hosts.length) {
    throw new Error("No hosts found in Nessus JSON export");
  }

  const firstFile = toArray(data.meta?.files)[0];

  return {
    name: firstFile?.reportName ?? firstFile?.name ?? parsed?.name ?? "Nessus Report",
    hosts,
    generatedAt: parsed?.exportedAt ?? firstFile?.scanEnd ?? firstFile?.scanStart
  };
};

export const parseNessusReport = (text: string): ParsedReport => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("File is empty");
  }

  if (trimmed.startsWith("{")) {
    return parseNessusJson(text);
  }

  return parseNessusXml(text);
};
