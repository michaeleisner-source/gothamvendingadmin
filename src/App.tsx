import { BrowserRouter } from "react-router-dom";
import AppShell from "@/components/AppShell";

export default function App() {
  console.log("App component rendering!");
  
  // Try a minimal test first
  try {
    return (
      <div style={{padding: '20px', fontSize: '18px'}}>
        <h1>LOADING TEST</h1>
        <p>If you see this, React is working!</p>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </div>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    return <div>ERROR: {String(error)}</div>;
  }
}