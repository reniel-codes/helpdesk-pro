import { useCallback, useEffect, useRef, useState } from 'react'

type Result<T> = { key: string; data?: T; error?: string }

/**
 * Loads data when the component appears, and again whenever `key` changes.
 * Returns { data, error, loading, reload }.
 *
 * `key` must change whenever the fetcher would return something different
 * (for example include the ticket id), because the fetcher itself is not
 * watched for changes.
 */
export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [result, setResult] = useState<Result<T> | null>(null)
  const [version, setVersion] = useState(0)
  const requestKey = `${key}#${version}`

  // Pages usually pass a brand-new arrow function on every render. Keeping the
  // latest one in a ref lets us call it without re-fetching on every render.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setResult({ key: requestKey, data })
      },
      (err: unknown) => {
        if (!cancelled) setResult({ key: requestKey, error: errorMessage(err) })
      },
    )
    // Ignore the answer if the key changed or the page closed before it arrived.
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const isCurrent = result?.key === requestKey
  // While reloading the SAME key, keep showing the old data instead of flashing
  // a spinner. Data for a different key (e.g. another ticket) is never shown.
  const sameKey = result?.key.startsWith(`${key}#`) ?? false

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    data: sameKey ? result?.data : undefined,
    error: isCurrent ? result?.error : undefined,
    loading: !isCurrent,
    reload,
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String(err.message)
  return 'Something went wrong.'
}
