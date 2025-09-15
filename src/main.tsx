import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DemoProvider } from "./lib/demo";
import { ScopeProvider } from "@/contexts/ScopeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ScopeProvider>
      <DemoProvider>
        <App />
      </DemoProvider>
    </ScopeProvider>
  </React.StrictMode>
);
