import { useState } from 'react'
import { Bot, MessageCircle, Send, UserRound } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askCareerCoach } from '../services/api'
import { Button, Card, PageHead } from '../components/ui'

export default function CareerCoach() {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const send = async (event) => {
    event.preventDefault()
    const prompt = message.trim()
    if (!prompt || sending) return

    setError('')
    setMessage('')
    setMessages((current) => [...current, { role: 'user', text: prompt }])
    setSending(true)
    try {
      const result = await askCareerCoach(prompt)
      setMessages((current) => [...current, { role: 'coach', text: result.reply }])
    } catch (requestError) {
      setMessage(prompt)
      setError(requestError.response?.data?.error || requestError.message || 'Could not reach the career coach.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHead title="Career Coach" text="Get concise, practical guidance for your career questions." />
      <Card className="mx-auto flex min-h-[60vh] max-w-3xl flex-col">
        <div className="flex-1 space-y-4" aria-live="polite" aria-label="Career coach conversation">
          {!messages.length && (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand"><MessageCircle className="size-6" /></div>
              <h3 className="mt-4 font-semibold">What would you like help with?</h3>
              <p className="mt-1 max-w-md text-sm text-muted">Ask about interview preparation, career planning, resumes, or building skills for your next role.</p>
            </div>
          )}
          {messages.map((item, index) => {
            const fromCoach = item.role === 'coach'
            const Icon = fromCoach ? Bot : UserRound
            return (
              <div key={`${item.role}-${index}`} className={`flex gap-3 ${fromCoach ? '' : 'flex-row-reverse'}`}>
                <div className={`grid size-8 shrink-0 place-items-center rounded-full ${fromCoach ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-muted dark:bg-white/10'}`}>
                  <Icon className="size-4" />
                </div>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${fromCoach ? 'bg-slate-100 dark:bg-white/5' : 'bg-brand text-white'}`}>
                  {fromCoach
                    ? <ReactMarkdown components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h2 className="mb-2 text-base font-semibold">{children}</h2>,
                      h2: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
                      h3: ({ children }) => <h4 className="mb-1 font-semibold">{children}</h4>,
                      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      a: ({ children, href }) => <a className="text-brand underline" href={href} target="_blank" rel="noreferrer">{children}</a>,
                      code: ({ children }) => <code className="rounded bg-black/5 px-1 dark:bg-white/10">{children}</code>,
                    }}>{item.text}</ReactMarkdown>
                    : item.text}
                </div>
              </div>
            )
          })}
          {sending && <p role="status" className="pl-11 text-sm text-muted">Preparing practical advice…</p>}
        </div>
        <form onSubmit={send} className="mt-6 flex items-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
          <label className="sr-only" htmlFor="career-coach-message">Your question</label>
          <textarea
            id="career-coach-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={8000}
            rows={2}
            placeholder="Ask a career question…"
            className="min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
            disabled={sending}
          />
          <Button type="submit" loading={sending} disabled={!message.trim() || sending} aria-label="Send question">
            <Send className="size-4" /> <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
      </Card>
    </div>
  )
}
