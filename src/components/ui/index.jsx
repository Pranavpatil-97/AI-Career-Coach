import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
export const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] ${className}`}>{children}</div>)
export const Button = ({ variant = 'primary', className = '', loading, children, ...p }) => (
  <button {...p} disabled={p.disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
      variant === 'primary' ? 'bg-gradient-to-r from-brand to-violet text-white hover:opacity-90'
      : 'border border-slate-200 bg-white text-ink hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'} ${className}`}>
    {loading && <Loader2 className="size-4 animate-spin" />}{children}</button>)
const S = {
  demonstrated: ['Demonstrated', 'bg-ok/10 text-green-700 dark:text-green-400'],
  partial: ['Partially Demonstrated', 'bg-warn/10 text-amber-700 dark:text-amber-400'],
  none: ['Not Demonstrated in Scope', 'bg-slate-500/10 text-slate-600 dark:text-slate-300'] }
export const SkillStatusBadge = ({ status }) => { const [l, c] = S[status] || S.none
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{l}</span> }
export const Chip = ({ children }) => <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-muted dark:bg-white/10 dark:text-slate-300">{children}</span>
export const StatCard = ({ icon: Icon, label, value, loading }) => (
  <Card><Icon className="size-5 text-brand" aria-hidden />
    <div className="mt-3 text-3xl font-semibold tabular-nums">{loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200 dark:bg-white/10" /> : value ?? '—'}</div>
    <div className="text-sm text-muted">{label}</div></Card>)
export const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3" role="status" aria-label="Loading">{Array.from({ length: rows }, (_, i) =>
    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/5" />)}</div>)
export const EmptyState = ({ title, text, action, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
    <Icon className="size-8 text-muted" aria-hidden /><h3 className="mt-3 font-semibold">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>{action && <div className="mt-4">{action}</div>}</div>)
export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-bad/30 bg-bad/5 p-4">
    <AlertTriangle className="mt-0.5 size-5 text-bad" /><div className="flex-1"><p className="font-medium">Couldn't load this data</p>
    <p className="text-sm text-muted">{message}</p></div>{onRetry && <Button variant="ghost" onClick={onRetry}>Retry</Button>}</div>)
export const Async = ({ q, empty, children }) => q.loading ? <LoadingSkeleton />
  : q.error ? <ErrorState message={q.error} onRetry={q.reload} />
  : !q.data || (Array.isArray(q.data) && !q.data.length) ? empty : children(q.data)
export const PageHead = ({ title, text, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    {text && <p className="mt-1 text-sm text-muted">{text}</p>}</div>{children}</div>)
