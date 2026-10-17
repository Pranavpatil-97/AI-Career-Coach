import { useMemo, useState } from 'react'
import { GitBranch, Search, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { analyzeRepos, getRepos } from '../services/api'
import { useApp } from '../context/AppContext'
import { Async, Button, Card, Chip, EmptyState, PageHead } from '../components/ui'
export default function Repositories() {
  const q = useApi(getRepos); const { selected, toggleRepo } = useApp(); const [s, setS] = useState(''); const [lang, setLang] = useState('all'); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const langs = useMemo(() => ['all', ...new Set((q.data?.repositories || q.data || []).map((r) => r.language).filter(Boolean))], [q.data])
  const repos = (q.data?.repositories || q.data || []).filter((r) => (lang === 'all' || r.language === lang) && `${r.name} ${r.description || ''}`.toLowerCase().includes(s.toLowerCase()))
  const go = async () => { setBusy(true); try { await analyzeRepos(selected); setMsg('Analysis started.') } catch (e) { setMsg(e.message) } setBusy(false) }
  return (<div><PageHead title="My repositories" text="Only repositories your GitHub authorization allows.">
    <Button onClick={go} loading={busy} disabled={!selected.length}>Analyze selected ({selected.length})</Button></PageHead>
    {q.data?.rateLimit?.remaining < 10 && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm"><AlertTriangle className="size-4 text-warn" />GitHub API rate limit is low ({q.data.rateLimit.remaining} requests left).</div>}
    {msg && <p role="status" className="mb-3 text-sm text-muted">{msg}</p>}
    <div className="mb-4 flex flex-wrap gap-2"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted" /><input aria-label="Search repositories" value={s} onChange={(e) => setS(e.target.value)} placeholder="Search repositories" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/5" /></div>
      {langs.map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-full px-3 py-1.5 text-xs ${lang === l ? 'bg-brand text-white' : 'bg-slate-100 text-muted dark:bg-white/10'}`}>{l}</button>)}</div>
    <Async q={q} empty={<EmptyState icon={GitBranch} title="No repositories found" text="Connect GitHub in Settings to list repositories you've authorized." />}>
      {() => <div className="grid gap-3 md:grid-cols-2">{repos.map((r) => <Card key={r.id} className={selected.includes(r.id) ? 'ring-2 ring-brand' : ''}>
        <label className="flex cursor-pointer gap-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleRepo(r.id)} className="mt-1 size-4 accent-brand" />
          <div className="min-w-0 flex-1"><div className="font-semibold">{r.name}</div><p className="line-clamp-2 text-sm text-muted">{r.description || 'No description'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">{r.language && <Chip>{r.language}</Chip>}<span>Updated {new Date(r.updatedAt).toLocaleDateString()}</span>
              {r.lastAnalyzedSha && <span className="font-mono">{r.lastAnalyzedSha.slice(0, 7)}</span>}<span>{r.monitoring ? '● Monitoring' : '○ Not monitored'}</span></div></div></label></Card>)}</div>}</Async></div>)
}
