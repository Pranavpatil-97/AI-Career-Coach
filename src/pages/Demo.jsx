import { useApi } from '../hooks/useApi'
import { getDemo } from '../services/api'
import { Async, Card, EmptyState, PageHead } from '../components/ui'
import AssessmentDiff from '../components/skills/AssessmentDiff'
import CodeCitation from '../components/skills/CodeCitation'
const STEPS = ['Job source', 'Requirements', 'GitHub evidence', 'Skill gap', 'Real commit', 'Reassessment', 'Updated evidence']
export default function Demo() {
  const q = useApi(getDemo)
  return (<div><PageHead title="Demo center" text="The full workflow in five minutes." />
    <ol className="mb-6 flex gap-2 overflow-x-auto pb-2">{STEPS.map((s, i) => <li key={s} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${i <= (q.data?.step ?? -1) ? 'bg-brand text-white' : 'bg-slate-100 text-muted dark:bg-white/10'}`}>{i + 1}. {s}</li>)}</ol>
    <Async q={q} empty={<EmptyState title="No demo run recorded" text="Analyze a real job and repository, then push a commit. The workflow will be recorded here." />}>
      {(d) => <div className="grid gap-4 lg:grid-cols-2">
        <Card><h3 className="font-semibold">Source & repository</h3><a className="text-sm text-brand" href={d.jobUrl} target="_blank" rel="noreferrer">{d.jobTitle}</a><p className="mt-1 font-mono text-xs text-muted">{d.repository} @ {d.commitSha?.slice(0, 7)}</p></Card>
        <Card><h3 className="font-semibold">Before and after</h3><div className="mt-2 space-y-2">{d.changes?.map((c) => <AssessmentDiff key={c.skill} {...c} />)}</div></Card>
        <Card className="lg:col-span-2"><h3 className="mb-2 font-semibold">Changed-file citations</h3><div className="space-y-2">{d.citations?.map((e, i) => <CodeCitation key={i} ev={e} />)}</div></Card></div>}</Async></div>)
}
