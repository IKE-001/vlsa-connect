'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/templates/AuthShell';
import { ApiError } from '@/lib/api/client';

/* ─── Validation ───────────────────────────────────────────────── */
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Enter phone in E.164 format, e.g. +265991234567')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  preferredLang: z.enum(['en', 'ny']),
});
type RegisterFormData = z.infer<typeof registerSchema>;

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Enter all 6 digits')
    .regex(/^\d{6}$/, 'Digits only'),
});
type OtpFormData = z.infer<typeof otpSchema>;

/* ─── Design tokens ────────────────────────────────────────────── */
const inkColor = '#151A17';
const inkSoft = '#6B7280';
const inkFaint = '#9CA3AF';
const lineColor = '#E4E7E5';
const brandGreen = '#2E7D46';
const btnGreen = '#1E3D28';

const inputBase =
  'w-full rounded-[10px] border px-3.5 py-3 text-[13.5px] outline-none transition-shadow focus:ring-[3px]';
const inputStyle: React.CSSProperties = {
  borderColor: lineColor,
  color: inkColor,
  fontFamily: 'inherit',
};

/* ─── Helpers ──────────────────────────────────────────────────── */
function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" strokeWidth="1.6" />}
    </svg>
  );
}

function TextField({
  id, label, type = 'text', placeholder, registration, error,
}: {
  id: string; label: string; type?: string; placeholder: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>; error?: string;
}) {
  return (
    <div className="mb-[15px]">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold" style={{ color: inkColor }}>
        {label} *
      </label>
      <input
        {...registration} id={id} type={type} placeholder={placeholder}
        className={inputBase}
        style={{ ...inputStyle, borderColor: error ? '#EF4444' : lineColor }}
        onFocus={(e) => { e.currentTarget.style.borderColor = brandGreen; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#EF4444' : lineColor; e.currentTarget.style.boxShadow = 'none'; }}
      />
      {error && <p className="mt-1 text-[12px]" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

function PasswordField({
  id, label, placeholder, registration, error,
}: {
  id: string; label: string; placeholder: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-[15px]">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold" style={{ color: inkColor }}>
        {label} *
      </label>
      <div className="relative">
        <input
          {...registration} id={id} type={show ? 'text' : 'password'} placeholder={placeholder}
          className={`${inputBase} pr-10`}
          style={{ ...inputStyle, borderColor: error ? '#EF4444' : lineColor }}
          onFocus={(e) => { e.currentTarget.style.borderColor = brandGreen; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#EF4444' : lineColor; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: inkFaint }}>
          <EyeIcon off={!show} />
        </button>
      </div>
      {error && <p className="mt-1 text-[12px]" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

function PrimaryButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full rounded-full py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: btnGreen, fontFamily: 'inherit', border: 'none' }}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}

function ApiErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-[10px] px-3.5 py-2.5 text-[12.5px]"
      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
      </svg>
      {message}
    </div>
  );
}

/* ─── OTP Input Row ────────────────────────────────────────────── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleChange = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, '').slice(-1);
    const arr = [...digits];
    arr[i] = d;
    const next = arr.join('').trimEnd();
    onChange(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="mb-6 flex gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={d.trim()}
          placeholder="–"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-[52px] w-12 rounded-[12px] border text-center text-[18px] font-bold outline-none transition-shadow"
          style={{
            borderColor: d.trim() ? brandGreen : lineColor,
            color: d.trim() ? inkColor : inkFaint,
            fontFamily: 'inherit',
            borderWidth: d.trim() ? '1.5px' : '1.5px',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = brandGreen; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = d.trim() ? brandGreen : lineColor; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  REGISTER PAGE                                                   */
/* ═══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'otp' | 'done'>('details');
  const [userEmail, setUserEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterFormData>({
      resolver: zodResolver(registerSchema),
      defaultValues: { fullName: '', email: '', phoneNumber: '', password: '', preferredLang: 'en' as const },
    });

  /* ── Step 1: Register ── */
  const onRegister = async (data: RegisterFormData) => {
    if (!agreedToTerms) { setApiError('Please agree to Terms & Privacy Policy.'); return; }
    setApiError(null);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        preferredLang: data.preferredLang,
        // only send phone if the user typed one
        ...(data.phoneNumber && data.phoneNumber.trim() !== '' ? { phoneNumber: data.phoneNumber } : {}),
      };
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) { setApiError(typeof json.error === 'string' ? json.error : 'Registration failed.'); return; }
      setUserEmail(data.email);
      setStep('otp');
    } catch { setApiError('Network error. Please check your connection.'); }
  };

  /* ── Step 2: Verify OTP ── */
  const onVerifyOtp = async () => {
    setOtpError(null);
    if (otpValue.trim().length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setSubmittingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp: otpValue }),
      });
      const json = await res.json();
      if (!json.success) { setOtpError(typeof json.error === 'string' ? json.error : 'Invalid OTP.'); return; }
      if (typeof window !== "undefined") {
        localStorage.removeItem("vsla_active_group_id");
      }
      setStep('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch { setOtpError('Network error. Please check your connection.'); }
    finally { setSubmittingOtp(false); }
  };

  /* ── Done ── */
  if (step === 'done') {
    return (
      <AuthShell panel="signup">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(46,125,70,0.12)' }}>
            <svg className="h-8 w-8" fill="none" stroke={brandGreen} strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mb-2 text-[20px] font-extrabold" style={{ color: inkColor }}>Email Verified!</h2>
          <p className="text-[13.5px]" style={{ color: inkSoft }}>Your account is ready. Redirecting to sign in…</p>
        </div>
      </AuthShell>
    );
  }

  /* ── OTP step ── */
  if (step === 'otp') {
    return (
      <AuthShell panel="verify">
        <h1 className="mb-1.5 text-[25px] font-extrabold" style={{ color: inkColor }}>Verify Code</h1>
        <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: inkSoft }}>
          Please enter the 6-digit code we just sent to{' '}
          <strong style={{ color: inkColor, fontWeight: 700 }}>{userEmail}</strong>
        </p>

        <p className="mb-2.5 text-[13px] font-semibold" style={{ color: inkColor }}>Code *</p>
        <OtpInput value={otpValue} onChange={setOtpValue} />

        {otpError && <ApiErrorBanner message={otpError} />}

        <button
          type="button" onClick={onVerifyOtp} disabled={submittingOtp}
          className="w-full rounded-full py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: btnGreen, fontFamily: 'inherit', border: 'none' }}>
          {submittingOtp ? 'Verifying…' : 'Verify'}
        </button>

        <p className="mt-5 text-center text-[13px]" style={{ color: inkSoft }}>
          Didn&apos;t receive the email?{' '}
          <button type="button" onClick={() => { setStep('details'); setOtpValue(''); setOtpError(null); }}
            className="font-bold underline" style={{ color: brandGreen }}>
            Resend Code
          </button>
        </p>
      </AuthShell>
    );
  }

  /* ── Registration form ── */
  return (
    <AuthShell panel="signup">
      <h1 className="mb-1.5 text-[25px] font-extrabold" style={{ color: inkColor }}>Sign Up</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: inkSoft }}>
        Fill your information below to create your VSLA account.
      </p>

      <form onSubmit={handleSubmit(onRegister)}>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3.5">
          <TextField id="fullName" label="Full Name" placeholder="Chifundo Banda"
            registration={register('fullName')} error={errors.fullName?.message} />
          <div className="mb-[15px]">
            <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: inkColor }}>
              Language *
            </label>
            <select {...register('preferredLang')}
              className={`${inputBase} bg-white`}
              style={{ ...inputStyle }}
              onFocus={(e) => { e.currentTarget.style.borderColor = brandGreen; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = lineColor; e.currentTarget.style.boxShadow = 'none'; }}>
              <option value="en">English</option>
              <option value="ny">Chichewa</option>
            </select>
          </div>
        </div>

        <TextField id="email" label="Email Address" type="email" placeholder="chifundo@example.com"
          registration={register('email')} error={errors.email?.message} />

        <TextField id="phoneNumber" label="Phone Number (optional)" type="tel" placeholder="+265991234567"
          registration={register('phoneNumber')} error={errors.phoneNumber?.message} />

        <PasswordField id="password" label="Password" placeholder="At least 8 characters"
          registration={register('password')} error={errors.password?.message} />

        {/* Terms */}
        <div className="mb-5 mt-1 flex items-start gap-2.5 text-[12.5px]" style={{ color: inkSoft }}>
          <button
            type="button"
            onClick={() => setAgreedToTerms((v) => !v)}
            className="mt-0.5 flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-[5px]"
            style={{ background: agreedToTerms ? brandGreen : 'transparent', border: agreedToTerms ? 'none' : `1.5px solid ${lineColor}` }}>
            {agreedToTerms && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-[11px] w-[11px]">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span>
            Agree with{' '}
            <a href="#" className="font-semibold underline" style={{ color: brandGreen }}>Terms &amp; Conditions</a>
            {' '}and{' '}
            <a href="#" className="font-semibold underline" style={{ color: brandGreen }}>Privacy Policy</a>
          </span>
        </div>

        {apiError && <ApiErrorBanner message={apiError} />}

        <PrimaryButton loading={isSubmitting}>Sign Up</PrimaryButton>
      </form>

      <p className="mt-5 text-center text-[13px]" style={{ color: inkSoft }}>
        Already have an account?{' '}
        <Link href="/login" className="font-bold underline" style={{ color: brandGreen }}>
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
