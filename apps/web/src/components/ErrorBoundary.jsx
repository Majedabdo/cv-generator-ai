import React from "react";
import { ServerErrorPage } from "@/pages/ErrorPages";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App error boundary:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) return <ServerErrorPage />;
    return this.props.children;
  }
}
