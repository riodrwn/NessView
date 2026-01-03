# NessView

Client-side Nessus/Tenable report viewer. Parse .nessus/.xml/.json exports locally, explore hosts and findings, and export CSV/XLSX/HTML — nothing leaves the browser.

![NessView UI](public/screenshot.png)

## Highlights
- 100% client-side: drag-and-drop or file picker for .nessus/.xml/.json (includes a built-in sample).
- Dashboards: severity distribution, risk score, totals, and quick KPIs.
- Views: Summary, Vulnerabilities, Hosts, Services with filters, accordions, and copy helpers.
- Exports: CSV (occurrences/findings), XLSX workbook (hosts, findings, scan info, severity tabs, vuln?IP summary), printable HTML summary.
- Privacy: no network calls; files stay in-memory in the tab.

## Getting started
```bash
npm ci
npm run dev
```
Open the Vite URL and drop in a Nessus/Tenable export.

## Usage tips
- Tabs: Summary (charts, cards, exports), Vulnerabilities (plugin list with copy), Hosts (accordion per host), Services (ports/protocols with hosts).
- Use **Load sample** to demo; **Clear** resets the state.
- Toast appears when copying from Vulnerabilities view.

## Export details
- `nessus-occurrences.csv`: every finding instance by host.
- `nessus-findings.csv`: unique findings with counts and affected host counts.
- XLSX: `Hosts`, `ScanInfo`, `Findings`, `Vuln_to_IP_Summary`, plus severity-specific sheets with colored tabs.
- HTML: top findings/hosts summary for quick sharing.

## Data handling
- Runs entirely in-browser; no uploads or external requests.
- Files remain in memory; close the tab to clear them.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the built app
- `npm run lint` — type-check only

## Deploy to GitHub Pages
- In `vite.config.ts`, set `base: '/<repo-name>/'` (currently `/NessView/`).
- Use the provided workflow `.github/workflows/deploy.yml` (build on `main`, upload `dist`, deploy with `actions/deploy-pages`).
- Push to `main`; Pages will publish to `https://riodrwn.github.io/<repo-name>/`.
