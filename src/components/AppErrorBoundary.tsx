import React from "react";
import { recoverFromStaleAppCache } from "@/lib/cacheRecovery";
import bumpCityLogo from "@/assets/bump-city-logo-hz.png";

type ErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Bump City render error", error, info);
  }

  private reloadApp = async () => {
    await recoverFromStaleAppCache(true);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <section className="w-full max-w-[430px] text-center space-y-5">
          <img src={bumpCityLogo} alt="Bump City" className="h-10 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Refresh Bump City</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We hit a temporary loading issue. Reloading clears the old app cache and brings you back safely.
            </p>
          </div>
          <button
            type="button"
            onClick={this.reloadApp}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
