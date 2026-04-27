import "@/lib/browserStorageGuard";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { recoverFromStaleAppCache } from "@/lib/cacheRecovery";
import App from "./App.tsx";
import "./index.css";

recoverFromStaleAppCache();

const root = createRoot(document.getElementById("root")!);
root.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
