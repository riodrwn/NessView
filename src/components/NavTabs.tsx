type TabKey = "summary" | "vulnerabilities" | "hosts" | "services";

interface Props {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "vulnerabilities", label: "Vulnerabilities" },
  { key: "hosts", label: "Hosts" },
  { key: "services", label: "Services" }
];

const NavTabs = ({ active, onSelect }: Props) => (
  <nav className="tabs">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        className={`tab ${active === tab.key ? "active" : ""}`}
        onClick={() => onSelect(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);

export default NavTabs;
