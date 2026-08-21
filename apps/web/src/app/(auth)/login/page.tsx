'use client';

import { ArrowRight, GraduationCap, IdCard, KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Input, cn, toast } from '@campus-bytes/ui';
import { Logo } from '@/components/brand/logo';
import { ApiError } from '@/lib/api-client';
import {
  adminLogin,
  restaurantLogin,
  studentRequestOtp,
  studentResendOtp,
  studentSignup,
  studentVerifyOtp,
} from '@/lib/auth-api';

type Role = 'student' | 'restaurant' | 'admin';
const TABS: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'admin', label: 'Admin' },
];

const RESEND_SECONDS = 45;

function errMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get('next') as Role) || 'student';
  const [mode, setMode] = useState<Role>(TABS.some((t) => t.value === initial) ? initial : 'student');

  const go = (role: Role) => router.replace(role === 'admin' ? '/admin' : role === 'restaurant' ? '/r' : '/');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={40} />
          <p className="text-sm text-ink-600">Campus-exclusive food ordering for NIMS University.</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 shadow-md">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-md bg-surface-cream p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setMode(t.value)}
                className={cn(
                  'rounded-sm py-2 text-sm font-medium transition-colors',
                  mode === t.value ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === 'student' ? (
            <StudentAuth onDone={() => go('student')} />
          ) : (
            <PasswordAuth mode={mode} onDone={() => go(mode)} />
          )}
        </div>

        {mode !== 'student' && process.env.NODE_ENV !== 'production' && (
          <p className="mt-4 text-center text-2xs text-ink-400">
            {mode === 'restaurant'
              ? 'Dev: owner@vistacolline.dev / Owner@12345'
              : 'Dev: admin@nims.dev / Admin@12345'}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Student (real email OTP) ─────────────────────────── */
function StudentAuth({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string | null>(null); // set once an OTP is sent

  if (email) {
    return <OtpStep email={email} onBack={() => setEmail(null)} onVerified={onDone} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-md border border-line p-0.5 text-sm">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-[6px] py-1.5 font-medium capitalize transition-colors',
              tab === t ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {t === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <LoginForm onSent={setEmail} />
      ) : (
        <SignupForm onSent={setEmail} />
      )}
    </div>
  );
}

function LoginForm({ onSent }: { onSent: (email: string) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await studentRequestOtp(identifier);
      onSent(res.email);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (identifier.trim().length >= 3) submit();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Welcome back</h2>
        <p className="text-sm text-ink-600">Sign in with a one-time code sent to your email.</p>
      </div>
      <Field label="Email or Student ID" htmlFor="identifier" error={error ?? undefined}>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@nims.edu or NIMS2023xxxx"
            className="pl-9"
            autoFocus
          />
        </div>
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={identifier.trim().length < 3}>
        Send OTP <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

function SignupForm({ onSent }: { onSent: (email: string) => void }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length >= 2 &&
    studentId.trim().length >= 3 &&
    course.trim().length >= 2 &&
    email.includes('@');

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await studentSignup({ name, studentId, course, email });
      onSent(res.email);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) submit();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Create your student account</h2>
        <p className="text-sm text-ink-600">We’ll verify your email with a one-time code.</p>
      </div>

      <Field label="Full Name" htmlFor="fullName">
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kanchan Yadav" className="pl-9" autoFocus />
        </div>
      </Field>

      <Field label="Student ID" htmlFor="studentId">
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="NIMS2023CS047" className="pl-9" />
        </div>
      </Field>

      <Field label="Course / Program" htmlFor="course">
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="B.Tech Computer Science" className="pl-9" />
        </div>
      </Field>

      <Field label="Email address" htmlFor="signup-email" error={error ?? undefined}>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nims.edu" className="pl-9" />
        </div>
      </Field>

      <Button type="submit" block size="lg" loading={busy} disabled={!valid}>
        Send OTP <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

function OtpStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setLeft(RESEND_SECONDS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1 && timer.current) {
          clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startCountdown]);

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentVerifyOtp(email, code);
      onVerified();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await studentResendOtp(email);
      startCountdown();
      setCode('');
      toast({ tone: 'success', title: 'New code sent', description: `Check ${email}.` });
    } catch (e) {
      toast({ tone: 'error', title: 'Could not resend', description: errMessage(e) });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) verify();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Verify your email</h2>
        <p className="text-sm text-ink-600">
          Enter the 6-digit code sent to <span className="font-medium text-ink-900">{email}</span>.
        </p>
      </div>

      <Field label="Verification code" htmlFor="otp" error={error ?? undefined}>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="text-center text-lg tracking-[0.4em]"
          autoFocus
        />
      </Field>

      <Button type="submit" block size="lg" loading={busy} disabled={code.length !== 6}>
        Verify & continue
      </Button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="text-ink-500 hover:text-ink-700">
          ← Use a different account
        </button>
        {left > 0 ? (
          <span className="text-ink-400">Resend in 0:{String(left).padStart(2, '0')}</span>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-brand-600 hover:text-brand-700">
            Resend OTP
          </button>
        )}
      </div>
    </form>
  );
}

/* ─────────────────────────── Restaurant / Admin (password) ─────────────────────────── */
function PasswordAuth({ mode, onDone }: { mode: 'restaurant' | 'admin'; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await (mode === 'admin' ? adminLogin(email, password) : restaurantLogin(email, password));
      onDone();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes('@') && password) submit();
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Email" htmlFor="pemail">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@outlet.dev" className="pl-9" autoFocus />
        </div>
      </Field>
      <Field label="Password" htmlFor="pw" error={error ?? undefined}>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
        </div>
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!email.includes('@') || !password}>
        {mode === 'admin' ? (
          <>
            <ShieldCheck className="h-4 w-4" /> Sign in to Admin
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
