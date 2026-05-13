import React from "react";
import { Button, Result } from "antd";
import { reportClientError } from "utils/errorReport";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try {
      reportClientError({
        message: String((error && error.message) || error || "render error"),
        stack:
          ((error && error.stack) || "") +
          "\n--- componentStack ---\n" +
          ((info && info.componentStack) || ""),
        endpoint: typeof window !== "undefined" ? window.location.pathname : "",
      });
    } catch (_) {
      // never throw from an error boundary
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="We've been notified. You can try reloading the page."
          extra={
            <Button
              type="primary"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
            >
              Reload
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
