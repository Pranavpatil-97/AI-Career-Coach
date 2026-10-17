import { Target, ExternalLink } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getGaps } from '../services/api'
import { Async, Card, EmptyState, PageHead, SkillStatusBadge } from '../components/ui'
import CodeCitation from '../components/skills/CodeCitation'
export default function SkillGaps() {
  const q = useApi(getGaps)
  return (<div><PageHead title="Skill gaps" text="Job requirements compared with repository evidence." />
    <Async q={q} empty={<EmptyState icon={Target} title="No gap analysis yet" text="Analyze a job against your repositories to see requirement-by-requirement results." />}>
      {(gaps) => <div className="space-y-4">{gaps.map((g) => <Card key={g.skill}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{g.skill} <span className="text-sm font-normal text-muted">· {g.category}</span></h3><SkillStatusBadge status={g.status} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><p className="text-xs font-medium text-muted">Job requirement</p><blockquote className="mt-1 border-l-2 border-brand pl-3 text-sm italic">{g.quote}</blockquote>
            <a href={g.jobUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand">Original posting <ExternalLink className="size-3" /></a></div>
          <div><p className="text-xs font-medium text-muted">Repository evidence</p><div className="mt-1 space-y-2">{g.evidence?.length ? g.evidence.map((e, i) => <CodeCitation key={i} ev={e} />) : <p className="text-sm text-muted">{g.explanation}</p>}</div></div></div>
        <p className="mt-4 text-sm"><b>Next step:</b> {g.nextStep}</p></Card>)}</div>}</Async></div>)
}
