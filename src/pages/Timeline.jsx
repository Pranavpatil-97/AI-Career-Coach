import { GitCommit, CheckCircle2, Loader2, XCircle, Activity } from 'lucide-react'
import { useLiveChanges } from '../hooks/useLiveChanges'
import { Card, EmptyState, ErrorState, PageHead } from '../components/ui'
import AssessmentDiff from '../components/skills/AssessmentDiff'
const ST = { completed: [CheckCircle2, 'text-ok'], running: [Loader2, 'text-brand animate-spin'], failed: [XCircle, 'text-bad'] }
export default function Timeline() {
  const { events, live, error } = useLiveChanges(); const latest = events[0]
  return (<div><PageHead title="Change timeline" text="Reassessments run automatically when new commits are detected.">
    <span className="flex items-center gap-2 text-sm text-muted"><span className={`size-2 rounded-full ${live ? 'bg-ok' : 'bg-warn'}`} />{live ? 'Live via Socket.IO' : 'Polling every 15s'}</span></PageHead>
    {error && <ErrorState message={error} />}
    {latest && <Card className="mb-4 text-sm"><div className="grid gap-2 sm:grid-cols-2"><div>Latest commit <code className="font-mono">{latest.commitSha?.slice(0, 7)}</code></div><div>Previously analyzed <code className="font-mono">{latest.previousSha?.slice(0, 7) || '—'}</code></div></div>
      {latest.progress != null && latest.status === 'running' && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={latest.progress}><div className="h-full bg-brand transition-all" style={{ width: `${latest.progress}%` }} /></div>}</Card>}
    {!events.length && !error ? <EmptyState icon={Activity} title="No changes detected yet" text="When a monitored repository receives a commit, its analysis appears here." /> :
      <ol className="space-y-4 border-l border-slate-200 pl-6 dark:border-white/10">{events.map((e) => { const [Icon, c] = ST[e.status] || ST.running
        return <li key={e.id} className="relative"><span className="absolute -left-[37px] grid size-7 place-items-center rounded-full bg-white dark:bg-deep"><Icon className={`size-5 ${c}`} /></span>
          <Card><div className="flex flex-wrap items-center gap-2 text-sm"><GitCommit className="size-4" /><b>{e.repository}</b><code className="font-mono text-xs">{e.commitSha?.slice(0, 7)}</code><span className="ml-auto text-xs text-muted">{new Date(e.at).toLocaleString()}</span></div>
            {e.files?.length > 0 && <ul className="mt-2 font-mono text-xs text-muted">{e.files.map((f) => <li key={f}>{f}</li>)}</ul>}
            <div className="mt-3 space-y-2">{e.changes?.map((c) => <AssessmentDiff key={c.skill} {...c} />)}</div></Card></li> })}</ol>}</div>)
}
