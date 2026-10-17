import { ArrowRight } from 'lucide-react'
import { SkillStatusBadge } from '../ui'
export default function AssessmentDiff({ skill, before, after }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
    <b>{skill}</b><SkillStatusBadge status={before} /><ArrowRight className="size-4 text-muted" /><SkillStatusBadge status={after} /></div>
}
