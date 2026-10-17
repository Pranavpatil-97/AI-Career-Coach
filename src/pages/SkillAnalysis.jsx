import { Fragment, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getSkills } from '../services/api'
import { Async, Card, EmptyState, PageHead, SkillStatusBadge } from '../components/ui'
import CodeCitation from '../components/skills/CodeCitation'
export default function SkillAnalysis() {
  const q = useApi(getSkills); const [open, setOpen] = useState(null)
  return (<div><PageHead title="Skill analysis" text="Every assessment links to real repository evidence." />
    <Async q={q} empty={<EmptyState icon={Sparkles} title="No assessments yet" text="Analyze selected repositories to see which skills your code demonstrates." />}>
      {(rows) => <Card className="overflow-x-auto p-0"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-muted dark:border-white/10"><tr>{['Skill', 'Status', 'Evidence', 'Repository', 'Confidence', 'Last assessed'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => {
          const rowKey = `${r.skill}-${r.repository || 'unknown'}`
          return <Fragment key={rowKey}>
          <tr className="border-b border-slate-100 dark:border-white/5"><td className="px-4 py-3 font-medium"><button aria-expanded={open === rowKey} onClick={() => setOpen(open === rowKey ? null : rowKey)} className="flex items-center gap-2"><ChevronDown className={`size-4 transition-transform ${open === rowKey ? 'rotate-180' : ''}`} />{r.skill}</button></td>
            <td className="px-4 py-3"><SkillStatusBadge status={r.status} /></td><td className="px-4 py-3">{r.evidence?.length || 0} citation(s)</td>
            <td className="px-4 py-3">{r.evidence?.[0]?.repository || '—'}</td><td className="px-4 py-3">{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'}</td><td className="px-4 py-3 text-muted">{r.assessedAt && new Date(r.assessedAt).toLocaleDateString()}</td></tr>
          {open === rowKey && <tr><td colSpan={6} className="space-y-3 bg-slate-50 p-4 dark:bg-white/[0.02]">
            {r.evidence?.length ? r.evidence.map((e, i) => <CodeCitation key={i} ev={e} />) : <p className="text-muted">No qualifying evidence was found in the selected repositories and analyzed commits. This describes the scope of the analysis, not your ability.</p>}</td></tr>}</Fragment>
        })}</tbody></table></Card>}</Async></div>)
}
