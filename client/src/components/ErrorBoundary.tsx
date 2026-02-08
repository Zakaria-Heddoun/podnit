"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
// Note: we intentionally avoid calling the hook at top-level in this class component to keep it safe for SSR.
type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can send error info to analytics here
    console.error("ErrorBoundary captured error:", error, info);
    if (typeof window !== "undefined") {
      (window as any).__LAST_CLIENT_ERROR = { error: String(error), info };
      // show a simple alert in case toasts fail so user sees immediate feedback
      try {
        // avoid swallowing errors in production builds
        setTimeout(() => {
          import('sonner').then(({ toast }) => {
            toast.error('A client-side error occurred. Please refresh the page.');
          }).catch(() => {});
        }, 50);
      } catch (e) {}
    }
  }

  componentDidMount() {
    if (typeof window === 'undefined') return;

    this._onError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error || event.message, event);
      (window as any).__LAST_CLIENT_ERROR = { error: String(event.error || event.message), info: event }; 
      this.setState({ hasError: true, error: event.error || new Error(String(event.message || 'Unknown error')) });
    };

    this._onRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      (window as any).__LAST_CLIENT_ERROR = { error: String(event.reason), info: event };
      this.setState({ hasError: true, error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)) });
    };

    window.addEventListener('error', this._onError as any);
    window.addEventListener('unhandledrejection', this._onRejection as any);
  }

  componentWillUnmount() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('error', this._onError as any);
    window.removeEventListener('unhandledrejection', this._onRejection as any);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <img src="/images/blank-error.png" alt="App Error" className="mx-auto mb-4 max-w-xs" />
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-gray-600">A client-side error occurred while loading the app. Please try refreshing or contact support.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
