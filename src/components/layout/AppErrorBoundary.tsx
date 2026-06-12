import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackCardProps {
  message: string;
  stack?: string;
  onGoHome: () => void;
  onRetry: () => void;
}

function ErrorFallbackCard({ message, stack, onGoHome, onRetry }: ErrorFallbackCardProps) {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-8 max-w-md text-center space-y-4">
      <div className="text-4xl">!</div>
      <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
      <p className="text-sm text-text-secondary">
        {message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <button
          onClick={onGoHome}
          className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
        >
          Go Home
        </button>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl accent-bg-light accent-text text-sm font-medium hover:brightness-105 transition-all"
        >
          Try Again
        </button>
      </div>
      {import.meta.env.DEV && stack && (
        <details className="text-left mt-4">
          <summary className="text-xs text-text-tertiary cursor-pointer">Error details</summary>
          <pre className="mt-2 text-xs text-text-tertiary bg-surface-secondary p-3 rounded-lg overflow-auto max-h-40">
            {stack}
          </pre>
        </details>
      )}
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();
  const err = error instanceof Error ? error : new Error(String(error));

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <ErrorFallbackCard
        message={err.message}
        stack={err.stack}
        onGoHome={() => {
          navigate('/');
          resetErrorBoundary();
        }}
        onRetry={resetErrorBoundary}
      />
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Intentional: the app has no telemetry, so this console.error is the
        // only crash forensics available via iPad Safari Web Inspector.
        console.error('[AppErrorBoundary]', error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Fallback for crashes above the router (boot, auth, route table). No router
// hooks allowed here — recovery is a hard reload / hard navigation.
function RootErrorFallback({ error }: FallbackProps) {
  const err = error instanceof Error ? error : new Error(String(error));

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-6">
      <ErrorFallbackCard
        message={err.message}
        stack={err.stack}
        onGoHome={() => window.location.assign(import.meta.env.BASE_URL)}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}

export function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={RootErrorFallback}
      onError={(error, info) => {
        // Intentional: only crash forensics available (see above).
        console.error('[RootErrorBoundary]', error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
