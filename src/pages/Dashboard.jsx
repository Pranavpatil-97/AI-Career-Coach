import { Link } from 'react-router-dom'
import { Briefcase, GitBranch, Lightbulb, Sparkles } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { analyzeRepos, getSummary } from '../services/api'
import { useApp } from '../context/AppContext'
import { Button, Card, StatCard, ErrorState, EmptyState } from '../components/ui'
const COLORS = ['#22C55E', '#F59E0B', '#94A3B8']
export default function Dashboard() {
  const q = useApi(getSummary); const { selected } = useApp(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const d = q.data
  const run = async () => { setBusy(true); try { await analyzeRepos(selected); setMsg('Analysis started. Results appear here when complete.') } catch (e) { setMsg(e.message) } setBusy(false) }
  const pie = d ? [['Demonstrated', d.skills?.demonstrated], ['Partially demonstrated', d.skills?.partial], ['Not demonstrated in scope', d.skills?.none]].map(([name, value]) => ({ name, value: value || 0 })) : []
  return (<div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-3xl font-semibold tracking-tight">Your career, powered by evidence.</h2>
        <p className="mt-1 text-muted">Understand what your code proves, discover opportunities, and close your skill gaps.</p></div>
      <Button onClick={run} loading={busy} disabled={!selected.length} title={selected.length ? '' : 'Select repositories first'}>Analyze My Portfolio</Button></div>
    {msg && <p role="status" className="text-sm text-muted">{msg} {!selected.length && <Link to="/repositories" className="text-brand">Select repositories</Link>}</p>}
    {q.error && <ErrorState message={q.error} onRetry={q.reload} />}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard icon={GitBranch} label="Repositories analyzed" value={d?.repositories} loading={q.loading} />
      <StatCard icon={Briefcase} label="Jobs matched" value={d?.jobs} loading={q.loading} />
      <StatCard icon={Sparkles} label="Skills demonstrated" value={d?.skills?.demonstrated} loading={q.loading} />
      <StatCard icon={Lightbulb} label="Skills to explore" value={d?.skills?.none} loading={q.loading} /></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1"><h3 className="font-semibold">Skill evidence overview</h3>
        {d && pie.some((p) => p.value) ? <><div className="h-48"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
          {pie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <ul className="space-y-1 text-sm">{pie.map((p, i) => <li key={p.name} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: COLORS[i] }} />{p.name}<b className="ml-auto">{p.value}</b></li>)}</ul></>
          : <EmptyState title="No assessments yet" text="Run an analysis on selected repositories to see evidence." />}</Card>
      <Card className="lg:col-span-2"><h3 className="font-semibold">Recent activity</h3>
        {d?.activity?.length ? <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4 dark:border-white/10">{d.activity.map((a) => <li key={a.id} className="text-sm"><b>{a.title}</b><div className="text-xs text-muted">{new Date(a.at).toLocaleString()}</div></li>)}</ol>
          : <p className="mt-3 text-sm text-muted">No activity recorded yet.</p>}</Card></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card><h3 className="font-semibold">Recommended opportunities</h3>{d?.opportunities?.length ? d.opportunities.map((j) => <div key={j.id} className="mt-3 text-sm"><b>{j.title}</b> · {j.company} <a className="text-brand" href={j.url} target="_blank" rel="noreferrer">Source</a></div>) : <p className="mt-3 text-sm text-muted">Add a real job URL on <Link to="/jobs" className="text-brand">Job Opportunities</Link>.</p>}</Card>
      <Card><h3 className="font-semibold">Skill gap highlights</h3>{d?.gaps?.length ? d.gaps.map((g) => <div key={g.skill} className="mt-3 text-sm"><b>{g.skill}</b><div className="text-muted">{g.nextStep}</div></div>) : <p className="mt-3 text-sm text-muted">Gaps appear after a job is analyzed.</p>}</Card>
      <Card><h3 className="font-semibold">Repository health</h3>{d?.repoHealth?.length ? d.repoHealth.map((r) => <div key={r.name} className="mt-3 text-sm"><b>{r.name}</b><div className="font-mono text-xs text-muted">{r.lastCommit?.slice(0, 7)} · {r.monitoring ? 'Monitoring' : 'Paused'}</div></div>) : <p className="mt-3 text-sm text-muted">No repositories selected.</p>}</Card></div>
  </div>)
}
