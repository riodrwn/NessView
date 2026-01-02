export const sampleNessusXml = `<?xml version="1.0" ?>
<NessusClientData_v2>
  <Report name="Sample Report">
    <ReportHost name="web-01">
      <HostProperties>
        <tag name="host-ip">10.0.0.11</tag>
        <tag name="operating-system">Ubuntu 22.04</tag>
      </HostProperties>
      <ReportItem port="443" svc_name="https" protocol="tcp" severity="3" pluginID="200001" pluginName="TLS Version 1.0 Protocol Detection" pluginFamily="General">
        <risk_factor>High</risk_factor>
        <description>The remote service supports TLS 1.0.</description>
        <solution>Disable TLS 1.0 and use TLS 1.2+</solution>
        <see_also>https://www.tenable.com/plugins/nessus/200001</see_also>
      </ReportItem>
      <ReportItem port="22" svc_name="ssh" protocol="tcp" severity="1" pluginID="200002" pluginName="SSH Weak Algorithms Supported" pluginFamily="SSH">
        <risk_factor>Low</risk_factor>
        <description>SSH weak algorithms are enabled.</description>
        <solution>Update SSH configuration to disable weak algorithms.</solution>
      </ReportItem>
    </ReportHost>
    <ReportHost name="db-01">
      <HostProperties>
        <tag name="host-ip">10.0.0.21</tag>
        <tag name="operating-system">Windows Server 2019</tag>
      </HostProperties>
      <ReportItem port="1433" svc_name="ms-sql-s" protocol="tcp" severity="4" pluginID="200003" pluginName="MS SQL Server Critical Patch Update" pluginFamily="Windows">
        <risk_factor>Critical</risk_factor>
        <description>MS SQL Server is missing a critical patch update.</description>
        <solution>Apply the latest security updates from the vendor.</solution>
        <cve>CVE-2024-0001</cve>
      </ReportItem>
      <ReportItem port="445" svc_name="smb" protocol="tcp" severity="2" pluginID="200004" pluginName="SMB Signing Disabled" pluginFamily="Windows">
        <risk_factor>Medium</risk_factor>
        <description>SMB signing is disabled on the remote host.</description>
        <solution>Enable SMB signing.</solution>
      </ReportItem>
    </ReportHost>
  </Report>
</NessusClientData_v2>`;
