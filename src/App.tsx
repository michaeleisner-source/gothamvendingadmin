import { BrowserRouter } from "react-router-dom";
import AppShell from "@/components/AppShell";

export default function App() {
  console.log("App component rendering!");
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}