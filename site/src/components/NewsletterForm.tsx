import { useState } from 'react'
import { Mail, Check } from 'lucide-react'

// 订阅服务 endpoint（Formspree / Buttondown 等）。
// 例：VITE_NEWSLETTER_ENDPOINT=https://formspree.io/f/xxxx
const ENDPOINT = (import.meta.env.VITE_NEWSLETTER_ENDPOINT as string) || ''

export default function NewsletterForm({ lang }: { lang: string }) {
  const en = lang === 'en'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const t = {
    label: en ? 'NEWSLETTER' : '订阅周刊',
    hint: en ? 'One issue, every week. No noise.' : '每周一期，没有噪音。',
    placeholder: en ? 'you@example.com' : '你的邮箱',
    button: en ? 'SUBSCRIBE' : '订阅',
    done: en ? 'Subscribed — check your inbox to confirm.' : '已订阅 —— 查收邮件确认。',
    error: en ? 'Something went wrong — try again.' : '出错了 —— 请重试。',
    noEndpoint: en ? 'Subscription not configured yet.' : '订阅尚未配置。',
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    if (!ENDPOINT) {
      setState('error')
      return
    }
    setState('sending')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="border-t border-kumo-hairline pt-8">
      <p className="font-mono text-[11px] tracking-[0.24em] text-kumo-inactive mb-2">
        {t.label}
      </p>
      <p className="text-kumo-subtle text-sm mb-5">{t.hint}</p>

      {state === 'done' ? (
        <p className="inline-flex items-center gap-2 text-kumo-subtle text-sm">
          <Check size={14} strokeWidth={1.5} className="text-kumo-success" />
          {t.done}
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 max-w-md">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 min-w-0 px-3 py-2.5 bg-kumo-base border border-kumo-hairline rounded-sm text-sm text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-kumo-brand text-kumo-brand text-sm font-medium rounded-sm hover:bg-kumo-brand hover:text-kumo-inverse transition-colors duration-200 disabled:opacity-50 shrink-0"
          >
            <Mail size={14} strokeWidth={1.5} />
            {state === 'sending' ? '…' : t.button}
          </button>
        </form>
      )}

      {state === 'error' && (
        <p className="text-kumo-danger text-xs mt-2">
          {ENDPOINT ? t.error : t.noEndpoint}
        </p>
      )}
    </div>
  )
}
