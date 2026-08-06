'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Bell,
  FlaskConical,
  Stethoscope,
  Users,
  Watch,
} from 'lucide-react'

const PORTAL_COPY = [
  {
    eyebrow: 'Clinical Portal',
    headline: 'Built for doctors.',
    sub: 'Every mother, watched.',
    body: 'Real-time vitals, high-risk alerts, and lab verification in one place.',
  },
  {
    eyebrow: 'Coordination Portal',
    headline: 'Built for NGOs.',
    sub: 'Every band, tracked.',
    body: 'Manage health bands, coordinate field care, and respond to emergencies across your service area.',
  },
  {
    eyebrow: 'Admin Console',
    headline: 'Built for oversight.',
    sub: 'Every system, visible.',
    body: 'User governance, alert thresholds, and platform health in one console.',
  },
] as const

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="h-64 w-64 sm:h-72 sm:w-72"
      role="img"
      aria-label="Illustration of a mother and child, connected to icons representing platform features"
    >
      <line x1="160" y1="140" x2="70" y2="70" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />
      <line x1="160" y1="140" x2="250" y2="60" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />
      <line x1="160" y1="150" x2="40" y2="180" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />
      <line x1="160" y1="150" x2="280" y2="180" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />
      <line x1="160" y1="170" x2="60" y2="270" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />
      <line x1="160" y1="170" x2="260" y2="270" stroke="#1F8A70" strokeWidth="1" opacity="0.6" />

      <path
        d="M148 60 a14 14 0 1 0 0.1 0 M150 74 q-4 14 -2 24 M148 96 q-22 8 -22 34 q0 26 22 34 q0 10 6 16 l14 0 q6 -6 6 -16 q22 -8 22 -34 q0 -26 -24 -35 M150 98 q26 4 26 34 q0 24 -18 32"
        fill="none"
        stroke="#FBFCFB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M140 130 q12 -6 22 4"
        fill="none"
        stroke="#E0A32E"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="animate-pulse"
      />

      {[
        { x: 70, y: 70, icon: HeartPulse },
        { x: 250, y: 60, icon: Bell },
        { x: 40, y: 180, icon: FlaskConical },
        { x: 280, y: 180, icon: Stethoscope },
        { x: 60, y: 270, icon: Users },
        { x: 260, y: 270, icon: Watch },
      ].map(({ x, y, icon: Icon }, i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="18" fill="#0D4F45" stroke="#1F8A70" strokeWidth="1" />
          <foreignObject x={x - 9} y={y - 9} width="18" height="18">
            <Icon size={18} color="#E1F5EE" strokeWidth={1.75} />
          </foreignObject>
        </g>
      ))}
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copyIndex, setCopyIndex] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const id = setInterval(() => {
      setCopyIndex((i) => (i + 1) % PORTAL_COPY.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const copy = PORTAL_COPY[copyIndex]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Call our session API route to set the role cookie
    const res = await fetch('/api/auth/session', {
      method: 'POST',
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to authenticate role')
      setLoading(false)
      return
    }

    // Role is set, let middleware route us properly
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Hero panel — hidden on small screens, no room for a split layout there */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[var(--color-pine-deep)] p-10 lg:flex lg:p-14">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-marigold)]">
            <HeartPulse size={13} color="#08332C" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium tracking-wide text-surface">MOMCARE</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <HeroIllustration />
        </div>

        <div className="max-w-sm" aria-live="polite">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-sage)]">
            {copy.eyebrow}
          </p>
          <p className="mb-1 font-display text-2xl font-semibold leading-snug text-surface">
            {copy.headline}
            <br />
            {copy.sub}
          </p>
          <p className="text-sm leading-relaxed text-[#C9DED8]">{copy.body}</p>
        </div>
      </div>

      {/* Auth card */}
      <div className="flex flex-1 items-center justify-center bg-surface p-6">
        <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-7">
          <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--color-pine-wash)]">
            <HeartPulse size={20} className="text-pine" strokeWidth={2} />
          </div>

          <h1 className="mb-1 text-center font-display text-xl font-semibold text-pine">
            Sign in to MomCare
          </h1>
          <p className="mb-6 text-center text-sm text-ink-muted">
            Clinical decision support, not a replacement for emergency care.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-[var(--color-clay)]/10 p-3 text-sm text-[var(--color-clay)]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink" htmlFor="email">
                Email or phone number
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line px-3 focus-within:border-pine">
                <Mail size={16} className="text-ink-muted" aria-hidden />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ayesha.raza@example.com"
                  className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-ink" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs text-pine hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-line px-3 focus-within:border-pine">
                <Lock size={16} className="text-ink-muted" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent py-2.5 text-sm text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--color-pine)]"
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pine py-2.5 text-sm font-medium text-surface transition-colors hover:bg-[var(--color-pine-deep)] disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-wide text-ink-muted">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            disabled
            title="Google sign-in isn't configured yet"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-medium text-ink-muted opacity-60"
          >
            Sign in with Google
            <span className="text-[10px] italic text-ink-muted">(coming soon)</span>
          </button>

          <p className="mt-5 text-center text-xs text-ink-muted">
            Don&apos;t have an account? <span className="font-medium text-pine">Request access</span>
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-line pt-4 text-[11px] text-ink-muted">
            <ShieldCheck size={13} aria-hidden />
            Encrypted and not a 24/7 emergency service — see full disclaimer
          </div>
        </div>
      </div>
    </div>
  )
}
