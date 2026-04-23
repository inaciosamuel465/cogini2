
import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });
        console.error("[CogniStream ErrorBoundary]", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        // Limpar estados potencialmente corrompidos
        try {
            localStorage.removeItem('sjl_state_v3');
            localStorage.removeItem('sjl_ent_queue');
            localStorage.removeItem('sjl_ent_meeting');
        } catch (e) { /* ignore */ }
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
                    <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            O CogniStream encontrou um erro inesperado. Isso não afetou seus dados salvos.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-6 text-left">
                                <p className="text-xs text-red-300 font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Home className="w-4 h-4" /> Início
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg"
                            >
                                <RefreshCw className="w-4 h-4" /> Recarregar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
