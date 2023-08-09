import React, { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error;
  errorInfo: React.ErrorInfo;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // In case the app crashes this component will restart it in 10 seconds
  // It will also print an obnoxious error message (useful for end users to grab a screenshot and report)
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: { name: '', message: '' },
      errorInfo: { componentStack: '' },
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(error, errorInfo);
    this.setState({ hasError: true, error, errorInfo });
    setTimeout(() => {
      window.location.reload();
    }, 30000);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ overflow: 'auto', height: '100%', width: '100%', background: 'white' }}>
          <h2>Something is borked! Restarting app in 30 seconds...</h2>
          <p>
            <b>Error:</b> {this.state.error.name}
          </p>
          <p>
            <b>Error message:</b> {this.state.error.message}
          </p>
          <p>
            <b>Error cause:</b> {this.state.error.cause}
          </p>
          <p>
            <b>Error component stack:</b> {this.state.errorInfo.componentStack}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
