# NessView

Client-side Nessus/Tenable report viewer built with Vite + React. Parse .nessus/.xml/.json exports locally, explore hosts and findings, and export CSV/XLSX/HTML—no data leaves your browser.

## Features
- Drag-and-drop or file picker for .nessus/.xml/.json (includes a built-in sample report).
- Dashboard: severity distribution, risk score, totals, and quick KPIs.
- Views: Summary, Vulnerabilities, Hosts, Services with filters and accordions.
- Exports: CSV for occurrences/findings, XLSX workbook (hosts, findings, scan info, severity tabs, vuln?IP summary), and printable HTML summary.
- Client-only: No network calls; files stay in-memory in the tab.

## Quick start
1) npm ci
2) npm run dev
3) Open the local URL from Vite and drop in a Nessus/Tenable export.

## Usage tips
- Tabs: Summary (charts, cards, exports), Vulnerabilities (plugins with copy), Hosts (accordion with per-host findings), Services (ports/protocols with hosts).
- Reset state with **Clear**; load a demo with **Load sample**.
- Toast copy helper in Vulnerabilities view.

## Export details
- nessus-occurrences.csv: every finding instance by host.
- nessus-findings.csv: unique findings with counts and affected host counts.
- XLSX: Hosts, ScanInfo, Findings, Vuln_to_IP_Summary, plus severity-specific sheets with colored tabs.
- HTML: Top findings/hosts summary for quick sharing.

## Data handling
- Runs entirely in-browser; no uploads or external requests.
- Files are kept in memory; close the tab to clear.

## Scripts
- npm run dev — start dev server
- npm run build — type-check + production build
- npm run preview — preview the built app
- npm run lint — type-check only

## Deploy to GitHub Pages
- Set base: '/<repo-name>/' in vite.config.ts.
- Add the GitHub Actions Pages workflow for Vite (build on main, upload dist, deploy with actions/deploy-pages).
- Push to main; GitHub Pages will publish to https://<you>.github.io/<repo-name>/.
