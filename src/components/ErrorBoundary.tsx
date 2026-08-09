"use client";
import { Component, ReactNode } from "react";

// Contains a render/runtime error in a subtree (e.g. the map) so it shows a small
// message instead of crashing the whole page.
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false, message: undefined as string | undefined };
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Fellow ErrorBoundary:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="state" role="alert">
            <h2>This view hit a snag</h2>
            <p>{this.state.message || "Something went wrong rendering this section."}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
