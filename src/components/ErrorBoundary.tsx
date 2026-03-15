'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] items-center justify-center p-8">
                    <div className="max-w-md text-center">
                        <div className="mb-4 text-4xl">⚠</div>
                        <h2 className="mb-2 text-lg font-bold font-mono uppercase tracking-wider text-[var(--foreground)]">
                            Algo deu errado
                        </h2>
                        <p className="mb-6 text-sm text-[var(--muted-foreground)] font-mono">
                            Ocorreu um erro inesperado. Tente recarregar a página.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: undefined });
                                window.location.reload();
                            }}
                            className="rounded-none border border-[var(--primary)] bg-[var(--primary)] px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest text-black transition-colors hover:bg-[var(--primary-hover)]"
                        >
                            Recarregar
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-4 max-h-32 overflow-auto rounded-none border border-red-500/30 bg-red-900/10 p-3 text-left text-[10px] text-red-400 font-mono">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
