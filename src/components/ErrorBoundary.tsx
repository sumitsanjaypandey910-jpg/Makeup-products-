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
        <div className="min-h-screen bg-[#F3F4F8] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-[#111827] mb-2">
              Workspace Notice
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              BeautyOS encountered an unexpected error while processing this view.
            </p>
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3 text-xs font-mono text-[#111827] break-words mb-6">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-5 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] transition-colors"
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
