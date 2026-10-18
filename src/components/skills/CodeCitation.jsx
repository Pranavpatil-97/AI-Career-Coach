import { ExternalLink } from 'lucide-react'
const KW = /\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|CREATE|TABLE|const|let|function|return|import|async|await|def|class)\b/g
const hl = (line) => line.split(KW).map((p, i) => i % 2 ? <span key={i} className="text-violet-400">{p}</span> : p)
export default function CodeCitation({ ev }) {
  const filePath = ev.filePath ?? ev.path ?? ev.file
  const startLine = Number(ev.startLine ?? ev.line ?? ev.lineNumber)
  const endLine = Number(ev.endLine ?? startLine)
  const excerpt = ev.excerpt ?? ev.snippet ?? ev.text ?? ev.code ?? ''
  const commitSha = ev.commitSha ?? ev.sha ?? ev.commit

  if (!filePath || !excerpt || !Number.isFinite(startLine)) return null

  const gh = ev.url || `${ev.repoUrl}/blob/${commitSha}/${filePath}#L${startLine}-L${endLine}`
  return (<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-3 py-2 text-xs dark:bg-white/5">
      <span className="font-mono">{ev.repository}/{filePath} · L{startLine}–{endLine} · {commitSha?.slice(0, 7)}</span>
      <a href={gh} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand">View on GitHub <ExternalLink className="size-3" /></a></div>
    <pre className="overflow-x-auto bg-deep p-3 font-mono text-xs leading-relaxed text-slate-200">
      {excerpt.split('\n').map((line, i) => <div key={i}><span className="mr-3 select-none text-slate-600">{startLine + i}</span>{hl(line)}</div>)}</pre>
    {ev.explanation && <p className="p-3 text-sm text-muted">{ev.explanation}</p>}</div>)
}
