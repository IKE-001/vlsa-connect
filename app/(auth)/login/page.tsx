'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/templates/AuthShell';
import { ApiError, setActiveGroupId } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { roleToDashboardPath } from '@/lib/auth/session';

/** After a successful login, look up the user's groups and persist the active one. */
async function hydrateActiveGroup(): Promise<void> {
  try {
    const res = await fetch('/api/groups');
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      setActiveGroupId(json.data[0].id);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vsla_active_group_id");
      }
    }
  } catch {
    // Non-fatal — dashboard will show onboarding if no group found
  }
}

/* ─── Validation ───────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const twoFaSchema = z.object({
  code: z.string().min(6).max(8),
});
type TwoFaFormData = z.infer<typeof twoFaSchema>;

/* ─── Shared design tokens ─────────────────────────────────────── */
const inkColor = '#151A17';
const inkSoft = '#6B7280';
const inkFaint = '#9CA3AF';
const lineColor = '#E4E7E5';
const brandGreen = '#2E7D46';
const btnGreen = '#1E3D28';

const inputCls =
  'w-full rounded-[10px] border px-3.5 py-3 text-[13.5px] outline-none transition-shadow focus:ring-[3px]';
const inputStyle = {
  borderColor: lineColor,
  color: inkColor,
  fontFamily: 'inherit',
} as React.CSSProperties;

const labelCls = 'mb-1.5 block text-[13px] font-semibold';

/* ─── Eye icon ─────────────────────────────────────────────────── */
function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" strokeWidth="1.6" />}
    </svg>
  );
}

/* ─── PasswordField ────────────────────────────────────────────── */
function PasswordField({
  id,
  label,
  placeholder,
  registration,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls} style={{ color: inkColor }}>
        {label} *
      </label>
      <div className="relative">
        <input
          {...registration}
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={`${inputCls} pr-10`}
          style={{
            ...inputStyle,
            borderColor: error ? '#EF4444' : lineColor,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = brandGreen;
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#EF4444' : lineColor;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: inkFaint }}
        >
          <EyeIcon off={!show} />
        </button>
      </div>
      {error && <p className="mt-1 text-[12px]" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

/* ─── TextField ────────────────────────────────────────────────── */
function TextField({
  id,
  label,
  type = 'text',
  placeholder,
  registration,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls} style={{ color: inkColor }}>
        {label} *
      </label>
      <input
        {...registration}
        id={id}
        type={type}
        placeholder={placeholder}
        className={inputCls}
        style={{
          ...inputStyle,
          borderColor: error ? '#EF4444' : lineColor,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = brandGreen;
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : lineColor;
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {error && <p className="mt-1 text-[12px]" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

/* ─── PrimaryButton ────────────────────────────────────────────── */
function PrimaryButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 w-full rounded-full py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: btnGreen, fontFamily: 'inherit', border: 'none' }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

/* ─── ApiErrorBanner ───────────────────────────────────────────── */
function ApiErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-[10px] px-3.5 py-2.5 text-[12.5px]"
      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LOGIN PAGE                                                      */
/* ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: register2fa,
    handleSubmit: handleSubmit2fa,
    formState: { errors: errors2fa, isSubmitting: isSubmitting2fa },
  } = useForm<TwoFaFormData>({ resolver: zodResolver(twoFaSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      const { requires2fa } = await login(data.email, data.password);
      if (requires2fa) {
        setStep('2fa');
      } else {
        const meRes = await fetch('/api/auth/me');
        const me = await meRes.json();
        const role: string = me?.data?.platformRole ?? 'MEMBER';
        // Hydrate active group context before redirect so dashboard hooks have data immediately
        await hydrateActiveGroup();
        router.push(roleToDashboardPath(role));
      }
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Network error. Please check your connection.');
    }
  };

  const onSubmit2fa = async (data: TwoFaFormData) => {
    setTwoFaError(null);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.code }),
      });
      const json = await res.json();
      if (!json.success) {
        setTwoFaError(typeof json.error === 'string' ? json.error : 'Invalid code.');
        return;
      }
      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();
      await hydrateActiveGroup();
      router.push(roleToDashboardPath(me?.data?.platformRole ?? 'MEMBER'));
    } catch {
      setTwoFaError('Network error. Please try again.');
    }
  };

  /* ── 2FA step ── */
  if (step === '2fa') {
    return (
      <AuthShell panel="login">
        <h1 className="mb-1.5 text-[25px] font-extrabold" style={{ color: inkColor }}>
          Two-Factor Auth
        </h1>
        <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: inkSoft }}>
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleSubmit2fa(onSubmit2fa)}>
          <TextField
            id="code"
            label="Authenticator Code"
            placeholder="000000"
            registration={register2fa('code')}
            error={errors2fa.code?.message}
          />

          {twoFaError && <ApiErrorBanner message={twoFaError} />}

          <PrimaryButton loading={isSubmitting2fa}>Verify &amp; Sign In</PrimaryButton>
        </form>

        <p className="mt-5 text-center text-[13px]" style={{ color: inkSoft }}>
          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="font-bold underline"
            style={{ color: brandGreen }}
          >
            ← Back to Sign In
          </button>
        </p>
      </AuthShell>
    );
  }

  /* ── Credentials step ── */
  return (
    <AuthShell panel="login">
      <h1 className="mb-1.5 text-[25px] font-extrabold" style={{ color: inkColor }}>
        Sign In
      </h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: inkSoft }}>
        Enter your email and password to access your VSLA account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          id="email"
          label="Email Address"
          type="email"
          placeholder="chifundo@example.com"
          registration={register('email')}
          error={errors.email?.message}
        />

        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter Password"
          registration={register('password')}
          error={errors.password?.message}
        />

        <div className="mb-5 flex items-center justify-between text-[12.5px]">
          <span />
          <Link href="/forgot-password" className="font-semibold hover:underline" style={{ color: brandGreen }}>
            Forgot password?
          </Link>
        </div>

        {apiError && <ApiErrorBanner message={apiError} />}

        <PrimaryButton loading={isSubmitting}>Sign In</PrimaryButton>
      </form>

      <p className="mt-5 text-center text-[13px]" style={{ color: inkSoft }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold underline" style={{ color: brandGreen }}>
          Sign Up
        </Link>
      </p>
    </AuthShell>
  );
}
