import { useState } from 'react'
import { ArrowRight, Github, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { connectGithub } from '../services/api'

export default function ConnectGithub() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const alreadyLinked = searchParams.get('error') === 'already-linked'
  const requestedNext = searchParams.get('next') || '/dashboard'
  const destination = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && requestedNext !== '/connect-github'
    ? requestedNext
    : '/dashboard'

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10 dark:bg-deep">
      <Card className="w-full max-w-lg p-7 sm:p-9">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-ink dark:bg-white/10 dark:text-white">
          <Github className="size-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Account setup</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Connect a GitHub account</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choose the GitHub profile you want CareerPilot to use for repository analysis. You can also do this later in Settings.
        </p>
        {alreadyLinked && <p role="alert" className="mt-4 rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm leading-5 text-ink dark:text-amber-100">
          This GitHub account is connected to another CareerPilot account. Sign in to that account to use it, or choose a different GitHub username. Connections cannot be transferred automatically.
        </p>}

        <label htmlFor="github-username" className="mt-6 block text-sm font-medium">GitHub username <span className="font-normal text-muted">(optional)</span></label>
        <input
          id="github-username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="octocat"
          maxLength={39}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <p className="mt-2 text-xs leading-5 text-muted">
          GitHub will suggest this account during authorization. If another profile is already signed in, switch accounts on GitHub before approving.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => connectGithub(username, destination)} className="w-full sm:w-auto">
            <Github className="size-4" aria-hidden="true" /> Continue to GitHub <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" onClick={() => navigate(destination, { replace: true })} className="w-full sm:w-auto">
            Continue without GitHub
          </Button>
        </div>

        <p className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-muted dark:border-white/10">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
          CareerPilot only reads repositories you authorize. You can disconnect GitHub in Settings.
        </p>
      </Card>
    </main>
  )
}