import { useEffect, useState } from 'react'
import { getChanges } from '../services/api'
// Polling is the reliable fallback and requires no client-side socket server.
export function useLiveChanges() {
  const [events, setEvents] = useState([])
  const [live, setLive] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    let alive = true
    const poll = () => getChanges().then((d) => { if (alive) { setEvents(d || []); setError(null); setLive(true) } }).catch((e) => { if (alive) { setError(e.response?.data?.error || e.message); setLive(false) } })
    poll()
    const timer = setInterval(poll, 10000)
    return () => { alive = false; clearInterval(timer) }
  }, [])
  return { events, live, error }
}
