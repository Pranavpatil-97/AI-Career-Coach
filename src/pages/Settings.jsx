import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useApp } from '../context/AppContext'
import { connectGithub, disconnectGithub, getGithubStatus, getHealth } from '../services/api'
import { Button, Card, PageHead } from '../components/ui'
const Toggle = ({ label, k, s, set }) => <label className="flex items-center justify-between py-2 text-sm">{label}<input type="checkbox" role="switch" checked={!!s[k]} onChange={(e) => set({ ...s, [k]: e.target.checked })} className="size-4 accent-brand" /></label>
export default function Settings() {
  const gh = useApi(getGithubStatus); const health = useApi(getHealth); const { dark, setDark } = useApp()
  const [p, setP] = useState(() => JSON.parse(localStorage.getItem('prefs') || '{"monitor":true,"notify":true,"privateRepos":false}'))
  const save = (n) => { setP(n); localStorage.setItem('prefs', JSON.stringify(n)) }
  const off = async () => { if (confirm('Disconnect GitHub? Monitoring will stop.')) { await disconnectGithub().catch(() => {}); gh.reload() } }
  return (<div className="max-w-2xl space-y-4"><PageHead title="Settings" />
    <Card><h3 className="font-semibold">GitHub</h3><p className="mt-1 text-sm text-muted">{gh.data?.connected ? `Connected as ${gh.data.login}` : 'Not connected'}</p>
      <div className="mt-3">{gh.data?.connected ? <Button variant="ghost" onClick={off}>Disconnect GitHub</Button> : <Button onClick={() => (connectGithub())}>Connect GitHub</Button>}</div></Card>
    <Card><h3 className="font-semibold">Analysis & monitoring</h3><Toggle label="Include private repositories" k="privateRepos" s={p} set={save} /><Toggle label="Monitor selected repositories for new commits" k="monitor" s={p} set={save} /></Card>
    <Card><h3 className="font-semibold">Notifications & privacy</h3><Toggle label="Notify me when a reassessment completes" k="notify" s={p} set={save} /><p className="mt-2 text-xs text-muted">Access tokens and secrets are held by the backend and never shown here.</p></Card>
    <Card><h3 className="font-semibold">Theme</h3><div className="mt-2 flex gap-2"><Button variant={dark ? 'ghost' : 'primary'} onClick={() => setDark(false)}>Light</Button><Button variant={dark ? 'primary' : 'ghost'} onClick={() => setDark(true)}>Dark</Button></div></Card>
    <Card><h3 className="font-semibold">Backend health</h3><p className="mt-1 text-sm text-muted">{health.loading ? 'Checking…' : health.error ? `Unreachable: ${health.error}` : 'Healthy'}</p></Card></div>)
}
