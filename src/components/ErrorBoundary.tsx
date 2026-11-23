import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('BeautyOS ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E8E0D8] rounded-2xl p-8">
            <h2 className="font-display text-2xl font-semibold text-[#1E1916] mb-2">
              Workspace Notice
            </h2>
            <p className="text-sm text-[#6E645D] mb-4">
              BeautyOS encountered an unexpected error while processing this view.
            </p>
            <div className="bg-[#F4EFEA] border border-[#E8E0D8] rounded-xl p-3 text-xs font-mono text-[#1E1916] break-words mb-6">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-5 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] transition-colors"
            >
              Return to Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
