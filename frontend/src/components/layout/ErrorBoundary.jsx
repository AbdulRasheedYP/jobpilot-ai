import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('JobPilot UI Render Crash caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 p-8 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Rendering Notice</h2>
              <p className="text-xs text-slate-500 mt-1">
                The interface encountered an unexpected data format while displaying the candidate profile.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-auto max-h-40">
              <code className="text-[11px] text-rose-700 font-mono block whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown render error'}
              </code>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
