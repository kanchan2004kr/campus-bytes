'use client';

import { ArrowRight, Eye, EyeOff, GraduationCap, IdCard, KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Input, cn, toast } from '@campus-bytes/ui';
import { Logo } from '@/components/brand/logo';
import { ApiError } from '@/lib/api-client';
import {
  adminLogin,
  restaurantLogin,
  studentForgotPassword,
  studentLogin,
  studentResendOtp,
  studentResetPassword,
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

/** Password field with a show/hide (eye) toggle. */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-10"
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:text-ink-700"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
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

/* ─────────────────────────── Student (password auth) ─────────────────────────── */
function StudentAuth({ onDone }: { onDone: () => void }) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null); // signup verification

  if (pendingEmail) {
    return <OtpStep email={pendingEmail} onBack={() => setPendingEmail(null)} onVerified={onDone} />;
  }

  if (view === 'forgot') {
    return <ForgotPasswordFlow onBack={() => setView('login')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-md border border-line p-0.5 text-sm">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={cn(
              'flex-1 rounded-[6px] py-1.5 font-medium capitalize transition-colors',
              view === t ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {t === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      {view === 'login' ? (
        <LoginForm onDone={onDone} onForgot={() => setView('forgot')} />
      ) : (
        <SignupForm onSent={setPendingEmail} />
      )}
    </div>
  );
}

function LoginForm({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = identifier.trim().length >= 3 && password.length >= 1;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentLogin(identifier, password);
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
        if (valid) submit();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Welcome back</h2>
        <p className="text-sm text-ink-600">Log in with your email or Student ID and password.</p>
      </div>
      <Field label="Email or Student ID" htmlFor="identifier">
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
      <Field label="Password" htmlFor="login-password" error={error ?? undefined}>
        <PasswordInput id="login-password" value={password} onChange={setPassword} placeholder="••••••••" />
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!valid}>
        Log In <ArrowRight className="h-4 w-4" />
      </Button>
      <button
        type="button"
        onClick={onForgot}
        className="text-center text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Forgot Password?
      </button>
    </form>
  );
}

function SignupForm({ onSent }: { onSent: (email: string) => void }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid =
    name.trim().length >= 2 &&
    studentId.trim().length >= 3 &&
    course.trim().length >= 2 &&
    email.includes('@') &&
    password.length >= 8 &&
    confirm === password;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await studentSignup({ name, studentId, course, email, password });
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

      <Field label="Email address" htmlFor="signup-email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nims.edu" className="pl-9" />
        </div>
      </Field>

      <Field
        label="Password"
        htmlFor="signup-password"
        error={passwordTooShort ? 'Password must be at least 8 characters.' : undefined}
      >
        <PasswordInput id="signup-password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
      </Field>

      <Field
        label="Confirm Password"
        htmlFor="signup-confirm"
        error={mismatch ? 'Passwords do not match.' : (error ?? undefined)}
      >
        <PasswordInput id="signup-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
      </Field>

      <Button type="submit" block size="lg" loading={busy} disabled={!valid}>
        Create Account <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

/* Forgot password: email → OTP + new password → reset. */
function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
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

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentForgotPassword(email);
      setStep('reset');
      startCountdown();
      toast({ tone: 'success', title: 'Check your email', description: `If ${email} is registered, a code is on its way.` });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const passwordTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canReset = code.length === 6 && password.length >= 8 && confirm === password;

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentResetPassword(email, code, password);
      toast({ tone: 'success', title: 'Password changed', description: 'Please log in with your new password.' });
      onBack();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'email') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes('@')) sendCode();
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Reset your password</h2>
          <p className="text-sm text-ink-600">Enter your registered email and we’ll send a verification code.</p>
        </div>
        <Field label="Email address" htmlFor="fp-email" error={error ?? undefined}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nims.edu" className="pl-9" autoFocus />
          </div>
        </Field>
        <Button type="submit" block size="lg" loading={busy} disabled={!email.includes('@')}>
          Send code <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" onClick={onBack} className="text-center text-sm text-ink-500 hover:text-ink-700">
          ← Back to log in
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canReset) reset();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Create a new password</h2>
        <p className="text-sm text-ink-600">
          Enter the 6-digit code sent to <span className="font-medium text-ink-900">{email}</span>.
        </p>
      </div>
      <Field label="Verification code" htmlFor="fp-code">
        <Input
          id="fp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="text-center text-lg tracking-[0.4em]"
          autoFocus
        />
      </Field>
      <Field label="New password" htmlFor="fp-password" error={passwordTooShort ? 'Password must be at least 8 characters.' : undefined}>
        <PasswordInput id="fp-password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
      </Field>
      <Field label="Confirm new password" htmlFor="fp-confirm" error={mismatch ? 'Passwords do not match.' : (error ?? undefined)}>
        <PasswordInput id="fp-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!canReset}>
        Reset password
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="text-ink-500 hover:text-ink-700">
          ← Back to log in
        </button>
        {left > 0 ? (
          <span className="text-ink-400">Resend in 0:{String(left).padStart(2, '0')}</span>
        ) : (
          <button type="button" onClick={sendCode} className="font-medium text-brand-600 hover:text-brand-700">
            Resend code
          </button>
        )}
      </div>
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
        <PasswordInput id="pw" value={password} onChange={setPassword} placeholder="••••••••" />
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
