import "@/lib/browserStorageGuard";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { recoverFromStaleAppCache } from "@/lib/cacheRecovery";
import App from "./App.tsx";
import "./index.css";

const renderBootError = () => {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:hsl(340 30% 97%);color:hsl(340 20% 15%);font-family:Jost,system-ui,sans-serif;padding:24px;text-align:center;box-sizing:border-box;">
      <section style="width:100%;max-width:430px;display:grid;gap:14px;justify-items:center;">
        <div style="width:44px;height:44px;border-radius:999px;background:hsl(0 46% 71% / 0.16);display:flex;align-items:center;justify-content:center;color:hsl(0 46% 61%);font-size:22px;font-weight:800;">B</div>
        <h1 style="font-size:24px;line-height:1.2;margin:0;font-weight:800;">Refresh Bump City</h1>
        <p style="font-size:14px;line-height:1.55;margin:0;color:hsl(340 10% 50%);">We hit a temporary loading issue. Reloading reconnects you safely.</p>
        <button type="button" onclick="window.location.reload()" style="margin-top:4px;border:0;border-radius:999px;background:hsl(0 46% 71%);color:white;font:inherit;font-size:14px;font-weight:800;padding:12px 22px;cursor:pointer;">Reload app</button>
      </section>
    </main>
  `;
};

void recoverFromStaleAppCache();

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Bump City root element was not found");

  createRoot(rootElement).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>,
  );
} catch (error) {
  console.error("Bump City boot error", error);
  renderBootError();
}
