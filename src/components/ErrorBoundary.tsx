"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
            }

            return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

interface DefaultErrorFallbackProps {
    error: Error;
    resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full glass rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
                <p className="text-foreground/70 mb-6">
                    We encountered an unexpected error. This has been logged and we're working to fix it.
                </p>
                <div className="space-y-3">
                    <Button onClick={resetError} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="w-full"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Go Home
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-sm text-foreground/60 hover:text-foreground/80">
                            Error Details (Dev Only)
                        </summary>
                        <pre className="mt-2 text-xs bg-surface p-2 rounded overflow-auto">
                            {error.message}
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
    return (error: Error, errorInfo?: { componentStack?: string }) => {
        console.error('Async error caught:', error, errorInfo);

        // In a real app, you might want to send this to an error reporting service
        // like Sentry, LogRocket, etc.

        // For now, we'll just log it and potentially show a toast
        if (typeof window !== 'undefined') {
            // You could integrate with a toast library here
            console.warn('An error occurred. Check the console for details.');
        }
    };
}

// Higher-order component for adding error boundaries to routes
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}