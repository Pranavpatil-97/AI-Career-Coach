import { useMemo, useState } from 'react'
import { Search, Briefcase, ExternalLink } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { addJobUrl, analyzeJob, fetchJobs, getJobs } from '../services/api'
import { Async, Button, Card, Chip, EmptyState, PageHead } from '../components/ui'
export default function Jobs() {
  const [role, setRole] = useState(''); const [fetching, setFetching] = useState(false); const [note, setNote] = useState('')
  const q = useApi(getJobs); const [s, setS] = useState(''); const [type, setType] = useState('all'); const [loc, setLoc] = useState('')
  const [url, setUrl] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(null)
  const list = useMemo(() => (q.data || []).filter((j) => (type === 'all' || j.type === type) && (!loc || j.location?.toLowerCase().includes(loc.toLowerCase()))
    && (!s || `${j.title} ${j.company} ${[...(j.required || []), ...(j.preferred || [])].join(' ')}`.toLowerCase().includes(s.toLowerCase()))), [q.data, s, type, loc])
  // const add = async (e) => { e.preventDefault(); try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) throw 0; setErr(''); await addJobUrl(url); setUrl(''); q.reload() } catch { setErr('Enter a valid http(s) job posting URL.') } }
  const add = async (e) => {e.preventDefault();
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('Enter a valid http(s) job posting URL.');
    setErr(''); await addJobUrl(url); setUrl(''); q.reload();
  } catch (ex) {
    setErr(ex instanceof TypeError ? 'Enter a valid http(s) job posting URL.' : ex.message);
  }
};
const fetchLive = async (e) => {
  e.preventDefault(); setNote(''); setFetching(true)
  try {
    const r = await fetchJobs(role)
    setNote(`Found ${r.found} postings, added ${r.added} new.`); q.reload()
  } catch (ex) { setNote(ex.response?.data?.error || ex.message) }
  finally { setFetching(false) }
}
  const inp = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5'
  const form = <form onSubmit={add} className="flex w-full max-w-md gap-2"><div className="flex-1"><input aria-label="Job URL" aria-invalid={!!err} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com/careers/role" className={`${inp} w-full`} />{err && <p role="alert" className="mt-1 text-xs text-bad">{err}</p>}</div><Button type="submit">Add job</Button></form>
  return (<div>
    <PageHead title="Job opportunities" text="Real postings only, each linked to its original source." />
    <form onSubmit={fetchLive} className="mb-4 flex flex-wrap items-center gap-2">
  <input aria-label="Role to fetch" value={role} onChange={(e) => setRole(e.target.value)}
    placeholder="Fetch live jobs for a role, e.g. python intern" className={`${inp} w-72`} />
  <Button type="submit" loading={fetching}>Fetch jobs</Button>
  {note && <span role="status" className="text-xs text-muted">{note}</span>}
</form>
    <div className="mb-4 flex flex-wrap gap-2"><div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-2.5 size-4 text-muted" /><input aria-label="Search jobs" value={s} onChange={(e) => setS(e.target.value)} placeholder="Search role, company, skill" className={`${inp} w-full pl-9`} /></div>
      <select aria-label="Employment type" value={type} onChange={(e) => setType(e.target.value)} className={inp}><option value="all">All types</option><option value="internship">Internship</option><option value="full-time">Full-time</option></select>
      <input aria-label="Location" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location" className={inp} /></div>
    <Async q={q} empty={<EmptyState icon={Briefcase} title="No jobs added yet" text="Paste the URL of a real job or internship posting to extract its requirements." action={form} />}>
      {() => <div className="grid gap-4 md:grid-cols-2">{list.length ? list.map((j) => <Card key={j.id}>
        <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{j.title}</h3><p className="text-sm text-muted">{j.company} · {j.location} · {j.type}</p></div>
          <a href={j.url} target="_blank" rel="noreferrer" aria-label="Original posting" className="text-brand"><ExternalLink className="size-4" /></a></div>
        <div className="mt-3 flex flex-wrap gap-1.5">{j.required?.map((k) => <Chip key={k}>{k}</Chip>)}{j.preferred?.map((k) => <span key={k} className="rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-xs text-muted dark:border-white/20">{k}</span>)}</div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted"><span>Retrieved {j.retrievedAt && new Date(j.retrievedAt).toLocaleString()} {j.source && <span>via {j.source}</span>}</span>
          <Button loading={busy === j.id} onClick={async () => { setBusy(j.id); try { await analyzeJob(j.id) } finally { setBusy(null) } }}>Analyze job</Button></div></Card>) : <p className="text-sm text-muted">No jobs match these filters.</p>}</div>}</Async>{q.data?.length > 0 && <div className="mb-4">{form}</div>}</div>)
}
