import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
// import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import "./App.css";
import { PortInfo } from "./types";

// Polyfill for WebviewWindow if it's not available (e.g. in browser)
// or if there's an issue with the import.
// This is a debugging step to see if the import is causing the white screen.
// console.log("WebviewWindow:", WebviewWindow);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

function App() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    pid: "",
    port: "",
    protocol: "",
    address: "",
  });

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const result = await invoke<PortInfo[]>("get_ports");
      setPorts(result);
    } catch (error) {
      console.error("Failed to fetch ports:", error);
    } finally {
      setLoading(false);
    }
  };

  const killProcess = async () => {
    if (selectedPid === null) return;

    const processPorts = ports
      .filter((p) => p.pid === selectedPid)
      .map((p) => p.port)
      .join(", ");
    const portText = processPorts
      ? ` (listening on port${
          processPorts.includes(",") ? "s" : ""
        }: ${processPorts})`
      : "";

    const confirmed = await confirm(
      `Are you sure you want to kill process ${selectedPid}${portText}?`,
      {
        title: "Port Manager",
        kind: "warning",
      }
    );

    if (!confirmed) return;

    try {
      const success = await invoke<boolean>("kill_process", {
        pid: selectedPid,
      });
      if (success) {
        await fetchPorts();
        setSelectedPid(null);
      } else {
        await message(
          "Failed to kill process. You might need administrator privileges.",
          { title: "Port Manager", kind: "error" }
        );
      }
    } catch (error) {
      console.error("Failed to kill process:", error);
      await message(`Error killing process: ${error}`, {
        title: "Port Manager",
        kind: "error",
      });
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 5000); // Auto refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const openSupport = async () => {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const { getCurrentWindow } = await import("@tauri-apps/api/window");

      const existing = await WebviewWindow.getByLabel("support");
      if (existing) {
        await existing.setFocus();
        return;
      }

      const parent = getCurrentWindow();
      const supportWindow = new WebviewWindow("support", {
        url: "index.html?page=support",
        title: "Support",
        width: 500,
        height: 450,
        parent: parent,
      });

      setIsSupportOpen(true);

      // Listen for the window being closed
      await supportWindow.once("tauri://destroyed", () => {
        setIsSupportOpen(false);
      });
    } catch (error) {
      console.error("Failed to open support window:", error);
      await message(`Failed to open support window: ${error}`, {
        title: "Error",
        kind: "error",
      });
      setIsSupportOpen(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFilter = (key: string) => {
    setActiveFilter(activeFilter === key ? null : key);
  };

  const uniqueProtocols = useMemo(() => {
    return Array.from(new Set(ports.map((p) => p.protocol))).sort();
  }, [ports]);

  const filteredPorts = useMemo(() => {
    return ports.filter((p) => {
      return (
        p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        p.pid.toString().includes(filters.pid) &&
        p.port.toString().includes(filters.port) &&
        (filters.protocol === "" || p.protocol === filters.protocol) &&
        p.address.includes(filters.address)
      );
    });
  }, [ports, filters]);

  return (
    <div className="container">
      {isSupportOpen && <div className="overlay" />}
      <header className="toolbar">
        <div className="title">Port Manager</div>
        <div className="actions">
          <button onClick={fetchPorts} disabled={loading}>
            Refresh
          </button>
          <button
            onClick={killProcess}
            disabled={selectedPid === null}
            className="danger"
          >
            Kill Process
          </button>

          <div></div>
          <div></div>

          <button
            onClick={() => openUrl("https://github.com/rakibtg/port-manager")}
          >
            GitHub
          </button>
          <button onClick={openSupport} className="support-btn">
            Support
          </button>
        </div>
      </header>

      <div className="content">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col"></th>
              <th>
                <div className="th-content">
                  <span>Process Name</span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFilter("name")}
                    title="Filter by name"
                  >
                    <SearchIcon />
                  </button>
                </div>
                {activeFilter === "name" && (
                  <input
                    className="filter-input"
                    autoFocus
                    placeholder="Search name..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                  />
                )}
              </th>
              <th>
                <div className="th-content">
                  <span>PID</span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFilter("pid")}
                    title="Filter by PID"
                  >
                    <SearchIcon />
                  </button>
                </div>
                {activeFilter === "pid" && (
                  <input
                    className="filter-input"
                    autoFocus
                    placeholder="Search PID..."
                    value={filters.pid}
                    onChange={(e) => handleFilterChange("pid", e.target.value)}
                  />
                )}
              </th>
              <th>
                <div className="th-content">
                  <span>Port</span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFilter("port")}
                    title="Filter by port"
                  >
                    <SearchIcon />
                  </button>
                </div>
                {activeFilter === "port" && (
                  <input
                    className="filter-input"
                    autoFocus
                    placeholder="Search port..."
                    value={filters.port}
                    onChange={(e) => handleFilterChange("port", e.target.value)}
                  />
                )}
              </th>
              <th>
                <div className="th-content">
                  <span>Protocol</span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFilter("protocol")}
                    title="Filter by protocol"
                  >
                    <FilterIcon />
                  </button>
                </div>
                {activeFilter === "protocol" && (
                  <select
                    className="filter-input"
                    autoFocus
                    value={filters.protocol}
                    onChange={(e) =>
                      handleFilterChange("protocol", e.target.value)
                    }
                    title="Select protocol"
                  >
                    <option value="">All</option>
                    {uniqueProtocols.map((proto) => (
                      <option key={proto} value={proto}>
                        {proto}
                      </option>
                    ))}
                  </select>
                )}
              </th>
              <th>
                <div className="th-content">
                  <span>Address</span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFilter("address")}
                    title="Filter by address"
                  >
                    <SearchIcon />
                  </button>
                </div>
                {activeFilter === "address" && (
                  <input
                    className="filter-input"
                    autoFocus
                    placeholder="Search address..."
                    value={filters.address}
                    onChange={(e) =>
                      handleFilterChange("address", e.target.value)
                    }
                  />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPorts.map((p) => (
              <tr
                key={`${p.pid}-${p.port}-${p.protocol}`}
                className={selectedPid === p.pid ? "selected" : ""}
                onClick={() =>
                  setSelectedPid(p.pid === selectedPid ? null : p.pid)
                }
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedPid === p.pid}
                    onChange={() => {}} // Handled by row click
                    title="Select row"
                  />
                </td>
                <td>{p.name}</td>
                <td>{p.pid}</td>
                <td>{p.port}</td>
                <td>{p.protocol}</td>
                <td>{p.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="status-bar">
        {filteredPorts.length} ports active.{" "}
        {selectedPid ? `Selected PID: ${selectedPid}` : "No selection"}
      </footer>
    </div>
  );
}

export default App;
