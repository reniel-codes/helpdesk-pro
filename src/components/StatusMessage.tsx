/** Loading / error / empty states, so every page shows them the same way. */
export function LoadingMessage({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-8 text-center text-slate-500">{label}</p>
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-medium underline">
          Try again
        </button>
      )}
    </div>
  )
}
