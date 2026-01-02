interface Props {
  onExportOccurrences: () => void;
  onExportFindings: () => void;
  onDownloadHtml: () => void;
  onExportXlsx: () => void;
}

const ExportBar = ({ onExportOccurrences, onExportFindings, onDownloadHtml, onExportXlsx }: Props) => (
  <section className="panel export-panel">
    <div className="panel-header">
      <h2>Export Reports</h2>
    </div>
    <div className="export-actions">
      <button onClick={onExportOccurrences}>Export Occurrences CSV</button>
      <button onClick={onExportFindings}>Export Findings CSV</button>
      <button onClick={onDownloadHtml}>Download HTML Report</button>
      <button onClick={onExportXlsx}>Export XLSX</button>
    </div>
  </section>
);

export default ExportBar;
