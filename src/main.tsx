import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Support from "./Support";

const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.get("page");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {page === "support" ? <Support /> : <App />}
  </React.StrictMode>
);
