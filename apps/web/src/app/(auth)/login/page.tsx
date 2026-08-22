'use client';

import { ArrowRight, Eye, EyeOff, IdCard, KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Input, cn, toast } from '@campus-bytes/ui';
import { Logo } from '@/components/brand/logo';
import { ApiError } from '@/lib/api-client';
import {
  adminForgotPassword,
  adminLogin,
  adminResetPassword,
  checkStudentId,
  registerComplete,
  registerSendOtp,
  registerVerifyOtp,
  restaurantForgotPassword,
  restaurantLogin,
  restaurantResetPassword,
  studentForgotById,
  studentLogin,
  studentResetById,
  type CheckIdResult,
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

/* ─────────────────────────── Student (Student ID + password) ─────────────────────────── */
function StudentAuth({ onDone }: { onDone: () => void }) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');

  if (view === 'forgot') {
    return <StudentForgotFlow onBack={() => setView('login')} />;
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
        <RegisterFlow onDone={onDone} />
      )}
    </div>
  );
}

/** Student login: Student ID + password (no OTP). */
function LoginForm({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = studentId.trim().length >= 3 && password.length >= 1;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentLogin(studentId, password);
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
        <p className="text-sm text-ink-600">Log in with your Student ID and password.</p>
      </div>
      <Field label="Student ID" htmlFor="login-studentid">
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="login-studentid"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="2026COMP0003"
            className="pl-9"
            autoCapitalize="characters"
            autoFocus
          />
        </div>
      </Field>
      <Field label="Password" htmlFor="login-password" error={error ?? undefined}>
        <PasswordInput id="login-password" value={password} onChange={setPassword} placeholder="••••••••" />
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!valid}>
        Sign In <ArrowRight className="h-4 w-4" />
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

/**
 * Approved-roster gated registration:
 *  Student ID (auto-checked) → name auto-fills (read-only) → email → Send OTP →
 *  Verify OTP → Create Password → account created + logged in.
 */
function RegisterFlow({ onDone }: { onDone: () => void }) {
  type Step = 'id' | 'otp' | 'password';
  const [step, setStep] = useState<Step>('id');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [idState, setIdState] = useState<'idle' | 'checking' | CheckIdResult['status']>('idle');
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
        if (s <= 1 && timer.current) { clearInterval(timer.current); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  // Auto-check the Student ID (debounced) — no separate "Continue" button.
  useEffect(() => {
    const id = studentId.trim();
    setName('');
    setError(null);
    if (id.length < 3) { setIdState('idle'); return; }
    setIdState('checking');
    const t = setTimeout(async () => {
      try {
        const res = await checkStudentId(id);
        setIdState(res.status);
        if (res.status === 'ok') setName(res.name);
      } catch {
        setIdState('idle');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [studentId]);

  const sendOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      await registerSendOtp(studentId, email);
      setStep('otp');
      startCountdown();
      toast({ tone: 'success', title: 'OTP sent', description: `Check ${email} for your code.` });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      await registerVerifyOtp(studentId, email, code);
      setStep('password');
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setBusy(true);
    setError(null);
    try {
      await registerComplete(studentId, email, password);
      toast({ tone: 'success', title: 'Account created', description: 'Welcome to CampusBytes!' });
      onDone();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3: password ──
  if (step === 'password') {
    const tooShort = password.length > 0 && password.length < 8;
    const mismatch = confirm.length > 0 && confirm !== password;
    const canCreate = password.length >= 8 && confirm === password;
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (canCreate) complete(); }} className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Create your password</h2>
          <p className="text-sm text-ink-600">Email verified. Set a password to finish.</p>
        </div>
        <Field label="Create Password" htmlFor="reg-pw" error={tooShort ? 'Password must be at least 8 characters.' : undefined}>
          <PasswordInput id="reg-pw" value={password} onChange={setPassword} placeholder="At least 8 characters" autoFocus />
        </Field>
        <Field label="Confirm Password" htmlFor="reg-confirm" error={mismatch ? 'Passwords do not match.' : (error ?? undefined)}>
          <PasswordInput id="reg-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
        </Field>
        <Button type="submit" block size="lg" loading={busy} disabled={!canCreate}>
          Create Account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  // ── Step 2: OTP ──
  if (step === 'otp') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (code.length === 6) verifyOtp(); }} className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Verify your email</h2>
          <p className="text-sm text-ink-600">
            Enter the 6-digit code sent to <span className="font-medium text-ink-900">{email}</span>.
          </p>
        </div>
        <Field label="Enter OTP" htmlFor="reg-otp" error={error ?? undefined}>
          <Input
            id="reg-otp"
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
          Verify OTP
        </Button>
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={() => { setStep('id'); setCode(''); }} className="text-ink-500 hover:text-ink-700">
            ← Change email
          </button>
          {left > 0 ? (
            <span className="text-ink-400">Resend in 0:{String(left).padStart(2, '0')}</span>
          ) : (
            <button type="button" onClick={sendOtp} className="font-medium text-brand-600 hover:text-brand-700">
              Resend OTP
            </button>
          )}
        </div>
      </form>
    );
  }

  // ── Step 1: Student ID → name → email → Send OTP ──
  const idOk = idState === 'ok';
  const canSend = idOk && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSend) sendOtp(); }} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Create your student account</h2>
        <p className="text-sm text-ink-600">Registration is for authorized NIMS students only.</p>
      </div>

      <Field
        label="Student ID"
        htmlFor="reg-studentid"
        error={
          idState === 'not_found'
            ? 'Student ID not found. Registration is available only for authorized NIMS students.'
            : idState === 'already_registered'
              ? 'This Student ID is already registered. Please sign in instead.'
              : undefined
        }
      >
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="reg-studentid"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="2026COMP0003"
            className="pl-9"
            autoCapitalize="characters"
            autoFocus
          />
          {idState === 'checking' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-ink-400">Checking…</span>
          )}
        </div>
      </Field>

      {/* Name auto-populates from the approved roster; read-only. */}
      <Field label="Name" htmlFor="reg-name">
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="reg-name"
            value={name}
            readOnly
            placeholder={idOk ? '' : 'Auto-filled after a valid Student ID'}
            className="pl-9 bg-surface-cream/60 text-ink-700"
            tabIndex={-1}
          />
        </div>
      </Field>

      {idOk && (
        <Field label="Student Email" htmlFor="reg-email" error={error ?? undefined}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className="pl-9" autoFocus />
          </div>
        </Field>
      )}

      <Button type="submit" block size="lg" loading={busy} disabled={!canSend}>
        Send OTP <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

/* Forgot password (student): Student ID → OTP to registered email → new password. */
function StudentForgotFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'id' | 'reset'>('id');
  const [studentId, setStudentId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
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
      setLeft((s) => { if (s <= 1 && timer.current) { clearInterval(timer.current); return 0; } return s - 1; });
    }, 1000);
  }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await studentForgotById(studentId);
      setMaskedEmail(res.email ?? null);
      setStep('reset');
      startCountdown();
      toast({ tone: 'success', title: 'Check your email', description: res.email ? `A code was sent to ${res.email}.` : 'If the Student ID is registered, a code is on its way.' });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canReset = code.length === 6 && password.length >= 8 && confirm === password;

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await studentResetById(studentId, code, password);
      toast({ tone: 'success', title: 'Password changed', description: 'Please log in with your new password.' });
      onBack();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'id') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (studentId.trim().length >= 3) sendCode(); }} className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Reset your password</h2>
          <p className="text-sm text-ink-600">Enter your Student ID — we’ll send a code to your registered email.</p>
        </div>
        <Field label="Student ID" htmlFor="fp-studentid" error={error ?? undefined}>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input id="fp-studentid" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="2026COMP0003" className="pl-9" autoCapitalize="characters" autoFocus />
          </div>
        </Field>
        <Button type="submit" block size="lg" loading={busy} disabled={studentId.trim().length < 3}>
          Send code <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" onClick={onBack} className="text-center text-sm text-ink-500 hover:text-ink-700">
          ← Back to log in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canReset) reset(); }} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Create a new password</h2>
        <p className="text-sm text-ink-600">
          Enter the 6-digit code{maskedEmail ? <> sent to <span className="font-medium text-ink-900">{maskedEmail}</span></> : ' sent to your registered email'}.
        </p>
      </div>
      <Field label="Verification code" htmlFor="fp-code">
        <Input id="fp-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="text-center text-lg tracking-[0.4em]" autoFocus />
      </Field>
      <Field label="New password" htmlFor="fp-password" error={tooShort ? 'Password must be at least 8 characters.' : undefined}>
        <PasswordInput id="fp-password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
      </Field>
      <Field label="Confirm new password" htmlFor="fp-confirm" error={mismatch ? 'Passwords do not match.' : (error ?? undefined)}>
        <PasswordInput id="fp-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!canReset}>
        Reset password
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="text-ink-500 hover:text-ink-700">← Back to log in</button>
        {left > 0 ? (
          <span className="text-ink-400">Resend in 0:{String(left).padStart(2, '0')}</span>
        ) : (
          <button type="button" onClick={sendCode} className="font-medium text-brand-600 hover:text-brand-700">Resend code</button>
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
  const [forgot, setForgot] = useState(false);

  if (forgot) {
    return <PasswordResetFlow mode={mode} onBack={() => setForgot(false)} />;
  }

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
      <button
        type="button"
        onClick={() => setForgot(true)}
        className="text-center text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Forgot Password?
      </button>
    </form>
  );
}

/* Restaurant/Admin password reset: email → OTP → new password. Admin OTP goes to
   the private recovery inbox; restaurant OTP goes to the owner's email. */
function PasswordResetFlow({ mode, onBack }: { mode: 'restaurant' | 'admin'; onBack: () => void }) {
  const forgotFn = mode === 'admin' ? adminForgotPassword : restaurantForgotPassword;
  const resetFn = mode === 'admin' ? adminResetPassword : restaurantResetPassword;
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await forgotFn(email);
      setStep('reset');
      toast({ tone: 'success', title: 'Check the recovery inbox', description: 'If the admin email is valid, a code has been sent.' });
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
      await resetFn(email, code, password);
      toast({ tone: 'success', title: 'Password changed', description: 'Please sign in with your new password.' });
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
          <h2 className="font-display text-lg font-semibold text-ink-900">Reset admin password</h2>
          <p className="text-sm text-ink-600">Enter the admin email — a one-time code is sent to the secure recovery inbox.</p>
        </div>
        <Field label="Admin email" htmlFor="ar-email" error={error ?? undefined}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input id="ar-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@campusbytes.college" className="pl-9" autoFocus />
          </div>
        </Field>
        <Button type="submit" block size="lg" loading={busy} disabled={!email.includes('@')}>
          Send code <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" onClick={onBack} className="text-center text-sm text-ink-500 hover:text-ink-700">
          ← Back to sign in
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
        <p className="text-sm text-ink-600">Enter the 6-digit code sent to the recovery inbox.</p>
      </div>
      <Field label="Verification code" htmlFor="ar-code">
        <Input
          id="ar-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="text-center text-lg tracking-[0.4em]"
          autoFocus
        />
      </Field>
      <Field label="New password" htmlFor="ar-password" error={passwordTooShort ? 'Password must be at least 8 characters.' : undefined}>
        <PasswordInput id="ar-password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
      </Field>
      <Field label="Confirm new password" htmlFor="ar-confirm" error={mismatch ? 'Passwords do not match.' : (error ?? undefined)}>
        <PasswordInput id="ar-confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
      </Field>
      <Button type="submit" block size="lg" loading={busy} disabled={!canReset}>
        Reset password
      </Button>
      <button type="button" onClick={onBack} className="text-center text-sm text-ink-500 hover:text-ink-700">
        ← Back to sign in
      </button>
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
