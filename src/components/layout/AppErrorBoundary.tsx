import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();
  const err = error instanceof Error ? error : new Error(String(error));

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="bg-surface-elevated border border-border rounded-2xl p-8 max-w-md text-center space-y-4">
        <div className="text-4xl">!</div>
        <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
        <p className="text-sm text-text-secondary">
          {err.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => {
              navigate('/');
              resetErrorBoundary();
            }}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 rounded-xl accent-bg-light accent-text text-sm font-medium hover:brightness-105 transition-all"
          >
            Try Again
          </button>
        </div>
        {import.meta.env.DEV && (
          <details className="text-left mt-4">
            <summary className="text-xs text-text-tertiary cursor-pointer">Error details</summary>
            <pre className="mt-2 text-xs text-text-tertiary bg-surface-secondary p-3 rounded-lg overflow-auto max-h-40">
              {err.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error('[AppErrorBoundary]', error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
