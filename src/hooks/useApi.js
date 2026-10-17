import { useCallback, useEffect, useState } from 'react'
export function useApi(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true, error: null })
  const run = useCallback(() => {
    set((s) => ({ ...s, loading: true, error: null }))
    return fn().then((data) => set({ data, loading: false, error: null }))
      .catch((e) => set({ data: null, loading: false,
        error: e.response?.status === 403 ? 'GitHub API rate limit reached. Try again later.' : e.message || 'Request failed' }))
  }, deps) // eslint-disable-line
  useEffect(() => { run() }, [run])
  return { ...state, reload: run }
}
