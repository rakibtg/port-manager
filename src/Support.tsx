import { openUrl } from "@tauri-apps/plugin-opener";
import "./App.css";

function Support() {
  return (
    <div className="container">
      <header className="toolbar">
        <div className="title">Port Manager</div>
      </header>
      <div className="support-container">
        <p style={{ marginTop: 0 }}>
          <strong>Support the Project</strong>
        </p>
        <p className="support-intro">
          <i>Port Manager</i> is a free and open-source cross platform app built
          and maintained by{" "}
          <strong>
            {" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openUrl("https://x.com/rakibtg");
              }}
            >
              @rakibtg
            </a>
          </strong>
          .
        </p>
        <p>You can support the development in several ways:</p>
        <ol className="support-list">
          <li>
            <strong>Sponsor on GitHub:</strong> Support the development
            financially by sponsoring at{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openUrl("https://github.com/sponsors/rakibtg");
              }}
            >
              github.com/sponsors/rakibtg
            </a>
          </li>
          <li>
            <strong>Star the Repository:</strong> Show your appreciation by
            giving the project a star on GitHub.
          </li>
          <li>
            <strong>Contribute Code:</strong> Help improve the app by submitting
            pull requests or reporting issues.
          </li>
          <li>
            <strong>Share the Word:</strong> Let others know about this tool by
            sharing it with your network.
          </li>
        </ol>
        <p>
          Find the source code on{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openUrl("https://github.com/rakibtg/port-manager");
            }}
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}

export default Support;
