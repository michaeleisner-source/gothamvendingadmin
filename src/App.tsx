import { BrowserRouter } from "react-router-dom";
import { ToastHost } from "@/components/useToast";
import AppShell from "@/components/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <AppShell />
    </BrowserRouter>
  );
}