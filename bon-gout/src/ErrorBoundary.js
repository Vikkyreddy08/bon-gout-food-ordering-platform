import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-black text-orange-500 mb-4">Oops!</h1>
            <p className="text-xl text-gray-300 mb-8">
              Something went wrong. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary px-8 py-4 text-lg"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
