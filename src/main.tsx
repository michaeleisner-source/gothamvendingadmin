import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Minimal test component to see if React loads at all
function TestApp() {
  console.log("TestApp: Rendering");
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>Site Loading Test</h1>
      <p>If you can see this, React is working.</p>
      <p>Check console for more debug info.</p>
    </div>
  );
}

console.log("main.tsx: Starting app initialization");

const rootElement = document.getElementById("root");
console.log("main.tsx: Root element found:", !!rootElement);

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  console.log("main.tsx: React root created, rendering...");
  
  root.render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  );
  
  console.log("main.tsx: Render complete");
} else {
  console.error("main.tsx: No root element found!");
}
