import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 600 }}>
          <h1 style={{ color: "#c00" }}>Something went wrong</h1>
          <pre style={{ background: "#f5f5f5", padding: 16, overflow: "auto" }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: "#666" }}>Check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = "<p>Root element not found.</p>";
} else {
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
