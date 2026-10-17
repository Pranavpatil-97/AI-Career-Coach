import { ExternalLink } from 'lucide-react'
const KW = /\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|CREATE|TABLE|const|let|function|return|import|async|await|def|class)\b/g
const hl = (line) => line.split(KW).map((p, i) => i % 2 ? <span key={i} className="text-violet-400">{p}</span> : p)
export default function CodeCitation({ ev }) {
  const gh = ev.url || `${ev.repoUrl}/blob/${ev.commitSha}/${ev.filePath}#L${ev.startLine}-L${ev.endLine}`
  return (<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-3 py-2 text-xs dark:bg-white/5">
      <span className="font-mono">{ev.repository}/{ev.filePath} · L{ev.startLine}–{ev.endLine} · {ev.commitSha?.slice(0, 7)}</span>
      <a href={gh} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand">View on GitHub <ExternalLink className="size-3" /></a></div>
    <pre className="overflow-x-auto bg-deep p-3 font-mono text-xs leading-relaxed text-slate-200">
      {(ev.excerpt || '').split('\n').map((l, i) => <div key={i}><span className="mr-3 select-none text-slate-600">{ev.startLine + i}</span>{hl(l)}</div>)}</pre>
    {ev.explanation && <p className="p-3 text-sm text-muted">{ev.explanation}</p>}</div>)
}
