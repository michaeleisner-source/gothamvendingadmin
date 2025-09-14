import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DemoProvider } from "./lib/demo";

createRoot(document.getElementById("root")!).render(
  <DemoProvider>
    <App />
  </DemoProvider>
);
