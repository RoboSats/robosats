import { Paper } from '@mui/material';
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
    }, 10000);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ overflow: 'auto', height: '100%', width: '100%', background: 'white' }}>
          <h2>Something is borked! Restarting app in 10 seconds...</h2>
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
