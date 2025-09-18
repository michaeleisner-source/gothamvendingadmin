import { BrowserRouter } from "react-router-dom";
import { ToastHost } from "@/components/useToast";
import AppShell from "@/components/AppShell";

export default function App() {
  console.log("App.tsx rendering...");
  return (
    <BrowserRouter>
      <ToastHost />
      <AppShell />
    </BrowserRouter>
  );
}