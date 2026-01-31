import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import ExportJsonFab from "./components/ExportJsonFab";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <ExportJsonFab />
  </React.StrictMode>
);
