import { ChangeEvent, useMemo, useState } from "react";
import {
  findingsCsvRows,
  overallTotals,
  occurrencesCsvRows,
  riskScore,
  severityPercents,
  summarizeHosts,
  summarizePlugins,
  tallySeverity
} from "./analytics";
import DashboardCharts from "./components/DashboardCharts";
import ExportBar from "./components/ExportBar";
import HostsTable from "./components/HostsTable";
import HostsAccordion from "./components/HostsAccordion";
import ServicesAccordion from "./components/ServicesAccordion";
import NavTabs from "./components/NavTabs";
import ScanReports from "./components/ScanReports";
import SummaryCards from "./components/SummaryCards";
import UniqueFindings from "./components/UniqueFindings";
import VulnerabilitiesTable from "./components/VulnerabilitiesTable";
import { parseNessusReport } from "./parser";
import { sampleNessusXml } from "./sample-data";
import { ParsedReport, SeverityLevel, severityLabel } from "./types";
import * as XLSX from "xlsx";
import { useRef } from "react";

type TabKey = "summary" | "vulnerabilities" | "hosts" | "services";

const formatBytes = (size?: number) => {
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const scaled = size / 1024 ** index;
  return `${scaled.toFixed(1)} ${units[index]}`;
};

const downloadCsv = (filename: string, rows: Record<string, string | number | undefined>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h];
          if (value === undefined || value === null) return "";
          const str = String(value).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    )
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function App() {
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string>("No file loaded");
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | null>(null);
  const [tab, setTab] = useState<TabKey>("summary");
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  const loadText = (text: string, name?: string) => {
    try {
      const parsed = parseNessusReport(text);
      setReport(parsed);
      setError(null);
      setSelectedSeverity(null);
      setFileLabel(name ?? parsed.name ?? "Loaded report");
      setTab("summary");
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    loadText(text, `${file.name} (${formatBytes(file.size)})`);
  };

  const onSample = () => {
    loadText(sampleNessusXml, "Sample report (built-in)");
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    loadText(text, `${file.name} (${formatBytes(file.size)})`);
  };

  const onClear = () => {
    setReport(null);
    setError(null);
    setSelectedSeverity(null);
    setFileLabel("No file loaded");
  };

  const severityBuckets = useMemo(() => (report ? tallySeverity(report.hosts) : []), [report]);
  const severityPerc = useMemo(() => severityPercents(severityBuckets), [severityBuckets]);
  const hostSummaries = useMemo(() => (report ? summarizeHosts(report.hosts) : []), [report]);
  const pluginSummaries = useMemo(() => {
    const all = report ? summarizePlugins(report.hosts) : [];
    if (selectedSeverity === null) return all;
    return all.filter((plugin) => plugin.severity === selectedSeverity);
  }, [report, selectedSeverity]);
  const totals = useMemo(() => overallTotals(report?.hosts ?? []), [report]);
  const score = useMemo(() => riskScore(severityBuckets), [severityBuckets]);

  const onExportOccurrences = () => {
    if (!report) return;
    downloadCsv("nessus-occurrences.csv", occurrencesCsvRows(report.hosts));
  };

  const onExportFindings = () => {
    downloadCsv("nessus-findings.csv", findingsCsvRows(pluginSummaries));
  };

  const onExportXlsx = () => {
    if (!report) return;

    const hostSheetData = [
      ["Host", "IP", "OS", "Total Findings", "Critical", "High", "Medium", "Low", "Info"]
    ];
    hostSummaries.forEach((h) => {
      hostSheetData.push([
        h.name,
        h.ip ?? "N/A",
        h.os ?? "N/A",
        h.totalFindings,
        h.severityTotals[4],
        h.severityTotals[3],
        h.severityTotals[2],
        h.severityTotals[1],
        h.severityTotals[0]
      ]);
    });

    const scanInfoHeaders = [
      "File",
      "IP Address",
      "FQDN",
      "Operating System",
      "System Type",
      "Scan Start",
      "Scan End",
      "Scan Duration (sec)",
      "Experimental Tests",
      "Credentialed"
    ];
    const scanInfoData = [scanInfoHeaders];

    const parseDate = (value?: string) => (value ? new Date(value) : undefined);
    const diffSeconds = (start?: string, end?: string) => {
      const s = parseDate(start);
      const e = parseDate(end);
      if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
      return Math.round((e.getTime() - s.getTime()) / 1000);
    };

    report.hosts.forEach((host) => {
      const start = host.properties["HOST_START"] ?? host.properties["host-start"];
      const end = host.properties["HOST_END"] ?? host.properties["host-end"];
      scanInfoData.push([
        report.name,
        host.properties["host-ip"] ?? "",
        host.properties["host-fqdn"] ?? host.name,
        host.properties["operating-system"] ?? "",
        host.properties["system-type"] ?? "",
        start ?? "",
        end ?? "",
        diffSeconds(start, end),
        host.properties["experimental-tests"] ?? "",
        host.properties["credentialed-scan"] ?? host.properties["credentialed"] ?? ""
      ]);
    });

    const findingsHeaders = ["Host", "IP", "Severity", "Plugin ID", "Plugin Name", "Family", "Port", "Protocol", "Service", "Description"];
    const findingsSheetData = [findingsHeaders];
    const severitySheets: Record<SeverityLevel, any[][]> = {
      0: [findingsHeaders],
      1: [findingsHeaders],
      2: [findingsHeaders],
      3: [findingsHeaders],
      4: [findingsHeaders]
    };
    report.hosts.forEach((host) => {
      host.items.forEach((item) => {
        const row = [
          host.name,
          host.properties["host-ip"] ?? "",
          severityLabel(item.severity),
          item.id,
          item.name,
          item.family,
          item.port ?? "",
          item.protocol ?? "",
          item.service ?? "",
          item.description ?? ""
        ];
        findingsSheetData.push(row);
        severitySheets[item.severity].push(row);
      });
    });

    // Vulnerability to IP Summary
    const vulnSummaryHeaders = ["File", "Severity", "Plugin ID", "Plugin Name", "IP Count", "IP Addresses"];
    const vulnSummaryData = [vulnSummaryHeaders];
    const vulnMap = new Map<
      string,
      {
        severity: SeverityLevel;
        pluginId: string;
        name: string;
        ips: Set<string>;
      }
    >();

    report.hosts.forEach((host) => {
      const ip = host.properties["host-ip"] ?? host.name;
      host.items.forEach((item) => {
        const key = item.id;
        const existing = vulnMap.get(key);
        if (existing) {
          existing.ips.add(ip);
        } else {
          vulnMap.set(key, {
            severity: item.severity,
            pluginId: item.id,
            name: item.name,
            ips: new Set<string>([ip])
          });
        }
      });
    });

    vulnMap.forEach((entry) => {
      vulnSummaryData.push([
        report.name,
        severityLabel(entry.severity),
        entry.pluginId,
        entry.name,
        entry.ips.size,
        Array.from(entry.ips).join(", ")
      ]);
    });

    const wb = XLSX.utils.book_new();
    const hostSheet = XLSX.utils.aoa_to_sheet(hostSheetData);
    const findingsSheet = XLSX.utils.aoa_to_sheet(findingsSheetData);
    const scanInfoSheet = XLSX.utils.aoa_to_sheet(scanInfoData);
    const vulnSummarySheet = XLSX.utils.aoa_to_sheet(vulnSummaryData);
    XLSX.utils.book_append_sheet(wb, hostSheet, "Hosts");
    XLSX.utils.book_append_sheet(wb, scanInfoSheet, "ScanInfo");
    XLSX.utils.book_append_sheet(wb, findingsSheet, "Findings");
    XLSX.utils.book_append_sheet(wb, vulnSummarySheet, "Vuln_to_IP_Summary");
    // Add severity-specific sheets
    const severityNames: Record<SeverityLevel, string> = { 4: "Critical", 3: "High", 2: "Medium", 1: "Low", 0: "Informational" };
    const severityColors: Record<SeverityLevel, string> = {
      4: "EF4444", // red
      3: "F97316", // orange
      2: "FACC15", // yellow
      1: "0EA5E9", // blue
      0: "22C55E" // green
    };

    (Object.keys(severitySheets) as unknown as SeverityLevel[]).forEach((level) => {
      const sheet = XLSX.utils.aoa_to_sheet(severitySheets[level]);
      XLSX.utils.book_append_sheet(wb, sheet, severityNames[level]);
      const sheetRef = wb.Sheets[severityNames[level]];
      if (sheetRef) {
        (sheetRef as any)["!tabColor"] = { rgb: severityColors[level] };
      }
    });

    XLSX.writeFile(wb, "nessus-report.xlsx");
  };

  const onDownloadHtml = () => {
    if (!report) return;

    const topFindings = [...pluginSummaries].sort((a, b) => b.hostCount - a.hostCount).slice(0, 10);
    const topHostsByRisk = [...hostSummaries]
      .sort(
        (a, b) =>
          b.severityTotals[4] + b.severityTotals[3] - (a.severityTotals[4] + a.severityTotals[3]) ||
          b.totalFindings - a.totalFindings
      )
      .slice(0, 10);

    const findingRows = topFindings
      .map(
        (p) => `
        <tr>
          <td><span class="pill pill-small sev-${p.severity}">${severityLabel(p.severity)}</span></td>
          <td>${p.name}</td>
          <td>${p.hostCount}</td>
          <td>${p.count}</td>
        </tr>`
      )
      .join("");

    const hostRows = topHostsByRisk
      .map(
        (h) => `
        <tr>
          <td>${h.name}</td>
          <td>${h.ip ?? "N/A"}</td>
          <td>${h.os ?? "N/A"}</td>
          <td>${h.severityTotals[4] + h.severityTotals[3]}</td>
          <td>${h.severityTotals[4]}</td>
          <td>${h.severityTotals[3]}</td>
          <td>${h.totalFindings}</td>
        </tr>`
      )
      .join("");

    const severityKpis = severityBuckets
      .map(
        (b) => `
        <div class="kpi tone-${b.level}">
          <span class="label">${b.label} Findings</span>
          <span class="value">${b.count}</span>
        </div>`
      )
      .join("");

    const totalsKpis = `
      <div class="kpi"><span class="label">Total Hosts</span><span class="value">${totals.totalHosts}</span></div>
      <div class="kpi"><span class="label">Total Findings</span><span class="value">${totals.totalFindings}</span></div>
      <div class="kpi"><span class="label">Risk Score</span><span class="value">${score}</span></div>
    `;

    const html = `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${report.name}</title>
        <style>
          :root { --bg:#0b1220; --panel:#0f172a; --border:#1f2937; --text:#e5e7eb; --muted:#9ca3af; }
          body { margin:0; font-family: "Segoe UI", system-ui, sans-serif; background: var(--bg); color: var(--text); padding:24px; }
          h1 { margin: 0 0 6px; }
          h2 { margin: 16px 0 10px; }
          h3 { margin: 12px 0 8px; color:#cbd5e1; }
          .panel { background: var(--panel); border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:16px; box-shadow:0 10px 30px rgba(0,0,0,0.25); }
          .kpi-row { display:flex; gap:10px; flex-wrap:wrap; align-items:stretch; }
          .kpi { background:#0c1020; border:1px solid var(--border); border-radius:10px; padding:10px 12px; min-width:120px; }
          .kpi .label { color: var(--muted); font-size:12px; display:block; }
          .kpi .value { font-size:20px; font-weight:700; }
          .tone-4 .value { color:#ef4444; }
          .tone-3 .value { color:#f97316; }
          .tone-2 .value { color:#facc15; }
          .tone-1 .value { color:#0ea5e9; }
          .tone-0 .value { color:#22c55e; }
          table { width:100%; border-collapse:collapse; margin-top:10px; }
          th, td { border:1px solid var(--border); padding:8px; text-align:left; font-size:14px; }
          th { text-transform:uppercase; font-size:12px; color: var(--muted); }
          .pill { display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; font-size:12px; color:#f8fafc; border:1px solid transparent; }
          .pill-small { font-size:11px; padding:2px 6px; }
          .sev-4 { background:#7f1d1d; border-color:#ef4444; }
          .sev-3 { background:#78350f; border-color:#f97316; }
          .sev-2 { background:#854d0e; border-color:#facc15; }
          .sev-1 { background:#0ea5e9; border-color:#38bdf8; }
          .sev-0 { background:#166534; border-color:#22c55e; }
          .grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
          .meta { color: var(--muted); font-size:14px; margin-top:4px; }
        </style>
      </head>
      <body>
        <h1>${report.name}</h1>
        <div class="meta">${fileLabel}</div>
        <div class="panel">
          <h2>Executive Summary</h2>
          <div class="kpi-row">${totalsKpis}${severityKpis}</div>
        </div>

        <div class="panel">
          <h2>Top 10 Findings by Affected Hosts</h2>
          <table>
            <thead>
              <tr><th>Severity</th><th>Finding</th><th>Affected Hosts</th><th>Occurrences</th></tr>
            </thead>
            <tbody>${findingRows}</tbody>
          </table>
        </div>

        <div class="panel">
          <h2>Top 10 Hosts by Critical/High Vulnerabilities</h2>
          <table>
            <thead>
              <tr>
                <th>Host</th><th>IP</th><th>OS</th><th>Total High/Critical</th><th>Critical</th><th>High</th><th>Total Findings</th>
              </tr>
            </thead>
            <tbody>${hostRows}</tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nessus-report.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  const faqs = [
    {
      id: "privacy",
      icon: "🌐",
      question: "Is my report uploaded anywhere?",
      answer: "No. All parsing and visualization happens entirely in your browser. Files never leave your device."
    },
    {
      id: "secure",
      icon: "🔒",
      question: "Is my data secure?",
      answer: "Yes. The app is read-only, runs locally, and never transmits your report contents over the network."
    },
    {
      id: "security",
      icon: "🚫",
      question: "Does the app need credentials or network access?",
      answer: "No. The tool runs locally, reads the provided .nessus/.xml/.json file, and does not reach out to external services."
    },
    {
      id: "storage",
      icon: "💾",
      question: "So, where is the data stored and how does it work?",
      answer: "Your file stays in memory within the browser tab; it is not saved to disk or sent anywhere. Close the tab to clear it."
    },
    {
      id: "formats",
      icon: "📄",
      question: "Which report formats are supported?",
      answer: "Nessus .nessus or .xml exports and the Tenable JSON export structure with hosts, findings, and instances sections."
    },
    {
      id: "data",
      icon: "📊",
      question: "What data is shown in the dashboards?",
      answer: "Hosts, plugin details, severities, ports, and plugin output are summarized to help you explore vulnerabilities quickly."
    }
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1>NessView – Nessus parsing and visualization scan results</h1>
          <p className="muted">
            Load a .nessus, .xml, or exported .json report to explore hosts, vulnerabilities, and severity distribution
            with exportable reports.
          </p>
        </div>
        <div className="header-actions">
          <button className="ghost" onClick={onSample}>
            Load sample
          </button>
          <button className="ghost" onClick={onClear}>
            Clear
          </button>
        </div>
      </header>

      {report && <NavTabs active={tab} onSelect={setTab} />}

      {error && <div className="alert danger">{error}</div>}

          {report && (
            <>
          {tab === "summary" && (
            <>
          <ExportBar
            onExportOccurrences={onExportOccurrences}
            onExportFindings={onExportFindings}
            onDownloadHtml={onDownloadHtml}
            onExportXlsx={onExportXlsx}
          />

              <SummaryCards
                fileName={fileLabel}
                generatedAt={report.generatedAt}
                totalHosts={totals.totalHosts}
                totalFindings={totals.totalFindings}
                uniquePlugins={totals.uniquePlugins}
                riskScore={score}
                totalOccurrences={totals.totalFindings}
              />

              <DashboardCharts
                buckets={severityBuckets}
                percents={severityPerc}
                selected={selectedSeverity}
                onSelect={(level) => setSelectedSeverity(level === selectedSeverity ? null : level)}
              />

              <UniqueFindings plugins={pluginSummaries} />

              <ScanReports hosts={hostSummaries} />
            </>
          )}

          {tab === "hosts" && <HostsAccordion hosts={report.hosts} />}

          {tab === "vulnerabilities" && <VulnerabilitiesTable plugins={pluginSummaries} onCopy={showToast} />}

          {tab === "services" && <ServicesAccordion hosts={report.hosts} />}
        </>
      )}
      {!report && (
        <div className="upload-panel">
          <div className="notice">
            <strong>Client-Side Processing</strong>
            <span>100% client-side. Nothing is uploaded to our servers.</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".nessus,.xml,.json"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <h3>Upload Nessus Reports</h3>
            <p>Drag and drop .nessus or .json files here, or click to browse</p>
            <button className="ghost" type="button">
              Select Files
            </button>
            <small>Supports .nessus XML files and exported .json files</small>
          </div>
        </div>
      )}
      {!report && (
        <section className="faq">
          <div className="faq-header">
            <h3>Frequently Asked Questions</h3>
            <p>Common questions about privacy, security, and how the tool works</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => {
              const open = openFaq === faq.id;
              return (
                <div key={faq.id} className={`faq-item ${open ? "open" : ""}`}>
                  <button className="faq-question" onClick={() => setOpenFaq(open ? null : faq.id)} aria-expanded={open}>
                    <span className="faq-question-text">
                      <span className="faq-icon" aria-hidden="true">
                        {faq.icon}
                      </span>
                      {faq.question}
                    </span>
                    <span className="faq-caret">{open ? "⌃" : "⌄"}</span>
                  </button>
                  {open && <div className="faq-answer">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <footer className="app-footer">
        Made with <span className="heart" aria-hidden="true">♥</span> by riodrwn
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
