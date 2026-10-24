import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandPanel from './BrandPanel';
import {
  DEMO_MODE,
  DEMO_ACCOUNTS,
  authenticate,
  setSession,
  routeForRole,
  type DemoRole,
} from '../../auth';

type Step = 'signin' | 'phone' | 'otp' | 'org';
const MAX_ATTEMPTS = 5;

const ORGS = [
  {
    name: 'Lotus Mart',
    meta: 'Owner · Partner Dashboard',
    icon: 'ri-store-2-line',
    bg: '#FFE3F1',
    fg: '#B4106A',
    role: 'owner' as DemoRole,
  },
  {
    name: 'Phố Cà Phê',
    meta: 'Manager · Partner Dashboard',
    icon: 'ri-cup-line',
    bg: '#E6F6EE',
    fg: '#1B7A4B',
    role: 'manager' as DemoRole,
  },
  {
    name: 'Lotus Mart — Hà Nội',
    meta: 'Cashier · Issue points',
    icon: 'ri-qr-scan-2-line',
    bg: '#FFF1D6',
    fg: '#8A5A00',
    role: 'cashier' as DemoRole,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [banner, setBanner] = useState<null | 'wrong' | 'lock'>(null);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  const [role, setRole] = useState<DemoRole | null>(null);

  const [cc, setCc] = useState('🇻🇳 +84');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState(false);
  const [timer, setTimer] = useState(0);
  const [org, setOrg] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const signinRef = useRef<HTMLButtonElement>(null);

  const locked = banner === 'lock';
  const canSubmit = !!email.trim() && !!pw && !locked && !loading && !redirect;
  const pill = role === 'admin' ? 'ADMIN' : 'OCTAP CONSOLE';

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const goAs = (r: DemoRole, label: string) => {
    setSession(r);
    setRedirect(label);
    setTimeout(() => navigate(routeForRole(r)), 900);
  };

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const r = authenticate(email, pw);
      if (r) {
        goAs(r, DEMO_ACCOUNTS[r].dest);
      } else {
        const n = attempts + 1;
        setAttempts(n);
        setBanner(n >= MAX_ATTEMPTS ? 'lock' : 'wrong');
      }
    }, 1000);
  };

  const pickDemo = (r: DemoRole) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r].email);
    setPw('octap123');
    setBanner(null);
    setEmailMsg('');
    setTimeout(() => signinRef.current?.focus(), 0);
  };

  const startOtp = () => {
    setOtp(Array(6).fill(''));
    setOtpError(false);
    setTimer(30);
    setStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 0);
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    setOtp((o) => o.map((x, k) => (k === i ? d : x)));
    setOtpError(false);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!t) return;
    e.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, k) => t[k] ?? ''));
    otpRefs.current[Math.min(t.length, 5)]?.focus();
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6 || verifying) return;
    if (timer <= 0) {
      setOtpError(true);
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (otp.join('') === '123456') goAs('owner', 'Partner Dashboard');
      else setOtpError(true);
    }, 700);
  };

  const fieldBad = banner !== null || !!emailMsg;

  if (!DEMO_MODE)
    return (
      <main className="p-8">
        <h1>Demo sign-in is disabled</h1>
        <p>Real console authentication is not connected yet.</p>
      </main>
    );

  return (
    <div className="theme-login">
      <div
        id="loginRoot"
        className="font-body antialiased grid lg:grid-cols-2 min-h-[100dvh]"
        style={{ background: 'var(--ground)', color: 'var(--ink)' }}
      >
        <BrandPanel pill={pill} />

        <section className="relative flex flex-col px-6 sm:px-12 lg:px-16 py-6 lg:py-8 min-h-[100dvh]">
          <div className="flex justify-end">
            <div
              role="group"
              aria-label="Language"
              className="inline-flex items-center gap-1 text-[13px] font-bold"
            >
              <button
                type="button"
                aria-pressed="true"
                className="px-2 py-1 rounded-md"
                style={{ color: 'var(--purple)' }}
              >
                EN
              </button>
              <span style={{ color: '#B9A6C0' }}>|</span>
              <button
                type="button"
                aria-pressed="false"
                className="px-2 py-1 rounded-md"
                style={{ color: 'var(--muted)' }}
              >
                VI
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-6">
            <div className="w-full max-w-[420px]">
              {step === 'signin' && (
                <div>
                  <h2 className="font-head text-[28px] font-extrabold tracking-tight leading-tight">
                    Sign in to your dashboard
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Manage points, campaigns and developer access for your organization.
                  </p>

                  {banner && (
                    <div
                      role="alert"
                      className="flex mt-6 rounded-2xl px-4 py-3 text-[14px] font-semibold items-start gap-2.5"
                      style={{
                        background: '#FFF0F3',
                        border: '1px solid #F5B5C2',
                        color: 'var(--err)',
                      }}
                    >
                      <i className="ri-error-warning-fill text-lg shrink-0 leading-none mt-px"></i>
                      <span>
                        {banner === 'lock' ? (
                          <>
                            Too many attempts — try again in 5 minutes or{' '}
                            <a href="#" className="underline font-bold">
                              reset your password
                            </a>
                            .
                          </>
                        ) : (
                          'Incorrect email or password.'
                        )}
                      </span>
                    </div>
                  )}

                  <form className="mt-6 flex flex-col gap-4" onSubmit={onSignIn} noValidate>
                    <div>
                      <label
                        htmlFor="email"
                        className="text-[13px] font-bold"
                        style={{ color: 'var(--muted)' }}
                      >
                        Work email
                      </label>
                      <div
                        className={`field-pill flex items-center gap-2 px-4 h-[50px] mt-1.5 ${fieldBad ? 'invalid' : ''}`}
                      >
                        <i className="ri-mail-line text-base" style={{ color: '#8C6F7D' }}></i>
                        <input
                          id="email"
                          type="email"
                          autoComplete="username"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setBanner(null);
                            setEmailMsg('');
                          }}
                          onBlur={() => {
                            const v = email.trim();
                            if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))
                              setEmailMsg('Enter a valid work email, like you@company.com.');
                          }}
                          className="flex-1 text-[15px] bg-transparent min-w-0"
                          aria-describedby="emailMsg"
                        />
                      </div>
                      <p
                        id="emailMsg"
                        aria-live="polite"
                        className="text-[13px] mt-1.5 font-semibold"
                        style={{ color: 'var(--err)' }}
                      >
                        {emailMsg}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="text-[13px] font-bold"
                          style={{ color: 'var(--muted)' }}
                        >
                          Password
                        </label>
                        <a
                          href="#"
                          className="text-[13px] font-bold"
                          style={{ color: 'var(--purple)' }}
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div
                        className={`field-pill flex items-center gap-2 pl-4 pr-1.5 h-[50px] mt-1.5 ${banner ? 'invalid' : ''}`}
                      >
                        <i className="ri-lock-2-line text-base" style={{ color: '#8C6F7D' }}></i>
                        <input
                          id="password"
                          type={showPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={pw}
                          onChange={(e) => {
                            setPw(e.target.value);
                            setBanner(null);
                          }}
                          onKeyDown={(e) => setCaps(e.getModifierState('CapsLock'))}
                          onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
                          onBlur={() => setCaps(false)}
                          className="flex-1 text-[15px] bg-transparent min-w-0"
                        />
                        <button
                          type="button"
                          aria-pressed={showPw}
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                          title={showPw ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPw((s) => !s)}
                          className="size-9 rounded-full flex items-center justify-center text-lg"
                          style={{ color: 'var(--muted)' }}
                        >
                          <i className={showPw ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                        </button>
                      </div>
                      {caps && (
                        <p
                          className="flex text-[13px] mt-1.5 font-semibold items-center gap-1.5"
                          style={{ color: '#8A5A00' }}
                        >
                          <i className="ri-capslock-line"></i>Caps Lock is on
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer"
                        style={{ color: 'var(--muted)' }}
                      >
                        <input type="checkbox" className="accent-[#D6177E] size-4 rounded" />
                        Keep me signed in on this device
                      </label>
                      <span className="tip inline-flex">
                        <button
                          type="button"
                          aria-label="Not recommended on shared computers"
                          className="size-5 rounded-full flex items-center justify-center text-base"
                          style={{ color: 'var(--muted)' }}
                        >
                          <i className="ri-information-line"></i>
                        </button>
                        <span className="tip-text" role="tooltip">
                          Not recommended on shared computers
                        </span>
                      </span>
                    </div>
                    <button
                      ref={signinRef}
                      type="submit"
                      className="btn-brand mt-1"
                      disabled={!canSubmit}
                    >
                      {loading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin text-xl"></i>Signing in…
                        </>
                      ) : redirect ? (
                        <>
                          <i className="ri-check-line text-xl"></i>Redirecting to {redirect}…
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </form>

                  <div className="flex items-center gap-3 my-6">
                    <div className="h-px flex-1" style={{ background: 'var(--line)' }}></div>
                    <span className="text-[13px] font-bold" style={{ color: 'var(--muted)' }}>
                      or
                    </span>
                    <div className="h-px flex-1" style={{ background: 'var(--line)' }}></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button type="button" className="btn-ghost" onClick={() => setStep('org')}>
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setStep('phone')}>
                      <i
                        className="ri-smartphone-line text-lg"
                        style={{ color: 'var(--purple)' }}
                      ></i>
                      Sign in with phone number
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
                      New to OctaP?{' '}
                      <a href="#" className="font-bold" style={{ color: 'var(--purple)' }}>
                        Register your business
                      </a>
                    </p>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
                      New registrations are reviewed by OctaP before activation.
                    </p>
                  </div>

                  {DEMO_MODE && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="font-head text-[14px] font-bold">Try a demo account</span>
                        <span
                          className="font-head text-[11px] font-extrabold tracking-wider px-2 py-0.5 rounded-md"
                          style={{ background: '#FFE3F1', color: 'var(--pink)' }}
                        >
                          DEMO
                        </span>
                      </div>
                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                        role="group"
                        aria-label="Demo accounts"
                      >
                        {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((k) => {
                          const a = DEMO_ACCOUNTS[k];
                          return (
                            <button
                              key={k}
                              type="button"
                              role="button"
                              aria-pressed={role === k}
                              onClick={() => pickDemo(k)}
                              className="demo-chip p-3 flex gap-3 items-start"
                            >
                              <span
                                className="size-9 rounded-full flex items-center justify-center text-lg shrink-0"
                                style={{ background: a.bg, color: a.fg }}
                              >
                                <i className={a.icon}></i>
                              </span>
                              <span className="min-w-0">
                                <span className="block font-head text-[14px] font-bold">
                                  {a.label}
                                </span>
                                <span
                                  className="block text-[12px]"
                                  style={{ color: 'var(--muted)' }}
                                >
                                  {a.org}
                                </span>
                                <span
                                  className="block text-[12px] font-semibold mt-0.5"
                                  style={{ color: 'var(--ink)' }}
                                >
                                  {a.hint}
                                </span>
                              </span>
                              <span
                                className="tick absolute top-2.5 right-2.5 size-5 rounded-full items-center justify-center text-xs text-white"
                                style={{ background: 'var(--purple)' }}
                              >
                                <i className="ri-check-line"></i>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p
                        className="text-[13px] mt-2.5 flex items-center gap-1.5"
                        style={{ color: 'var(--muted)' }}
                      >
                        <i className="ri-information-line"></i>Platform admin opens the Admin
                        Dashboard, not the Partner Dashboard.
                      </p>
                      <p className="text-[13px] mt-1.5" style={{ color: 'var(--muted)' }}>
                        Demo password for every account:{' '}
                        <span className="font-mono font-semibold" style={{ color: 'var(--pink)' }}>
                          octap123
                        </span>
                      </p>
                    </div>
                  )}

                  <p className="text-[13px] text-center mt-7" style={{ color: 'var(--muted)' }}>
                    Looking for the customer wallet instead?{' '}
                    <a href="#" className="font-bold" style={{ color: 'var(--purple)' }}>
                      Open the member app →
                    </a>
                  </p>
                </div>
              )}

              {step === 'phone' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('signin')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-6"
                    style={{ color: 'var(--purple)' }}
                  >
                    <i className="ri-arrow-left-line"></i>Back to sign in
                  </button>
                  <h2 className="font-head text-[28px] font-extrabold tracking-tight leading-tight">
                    Sign in with phone number
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    We'll text you a 6-digit code to confirm it's you.
                  </p>
                  <form
                    className="mt-7 flex flex-col gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (phone.replace(/\D/g, '').length >= 9) startOtp();
                    }}
                    noValidate
                  >
                    <div>
                      <label
                        htmlFor="phone"
                        className="text-[13px] font-bold"
                        style={{ color: 'var(--muted)' }}
                      >
                        Phone number
                      </label>
                      <div className="flex gap-2.5 mt-1.5">
                        <div className="field-pill flex items-center px-3 h-[50px] shrink-0 relative">
                          <select
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            aria-label="Country code"
                            className="bg-transparent text-[15px] font-semibold pr-6 appearance-none cursor-pointer"
                          >
                            <option>🇻🇳 +84</option>
                            <option>🇸🇬 +65</option>
                            <option>🇹🇭 +66</option>
                            <option>🇺🇸 +1</option>
                          </select>
                          <i
                            className="ri-arrow-down-s-line absolute right-3 pointer-events-none"
                            style={{ color: 'var(--muted)' }}
                          ></i>
                        </div>
                        <div className="field-pill flex items-center gap-2 px-4 h-[50px] flex-1 min-w-0">
                          <i className="ri-phone-line text-base" style={{ color: '#8C6F7D' }}></i>
                          <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="912 345 678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                            className="flex-1 text-[15px] bg-transparent min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn-brand mt-1"
                      disabled={phone.replace(/\D/g, '').length < 9}
                    >
                      Send code
                    </button>
                  </form>
                  <p className="text-[13px] mt-5 text-center" style={{ color: 'var(--muted)' }}>
                    Standard messaging rates may apply.
                  </p>
                </div>
              )}

              {step === 'otp' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-6"
                    style={{ color: 'var(--purple)' }}
                  >
                    <i className="ri-arrow-left-line"></i>Change number
                  </button>
                  <h2 className="font-head text-[28px] font-extrabold tracking-tight leading-tight">
                    Enter the 6-digit code
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Sent to{' '}
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>
                      {cc.replace(/^\S+\s/, '')} {phone}
                    </span>
                    . For this demo use{' '}
                    <span className="font-mono font-semibold" style={{ color: 'var(--pink)' }}>
                      123456
                    </span>
                    .
                  </p>
                  {otpError && (
                    <div
                      role="alert"
                      className="flex mt-6 rounded-2xl px-4 py-3 text-[14px] font-semibold items-start gap-2.5"
                      style={{
                        background: '#FFF0F3',
                        border: '1px solid #F5B5C2',
                        color: 'var(--err)',
                      }}
                    >
                      <i className="ri-error-warning-fill text-lg shrink-0 leading-none mt-px"></i>
                      <span>
                        That code is incorrect or has expired. Check the message or request a new
                        code.
                      </span>
                    </div>
                  )}
                  <form className="mt-6" onSubmit={verify} noValidate>
                    <div
                      className="grid grid-cols-6 gap-2 sm:gap-2.5"
                      role="group"
                      aria-label="Verification code"
                      onPaste={onPaste}
                    >
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          className={`otp ${otpError ? 'bad' : ''}`}
                          inputMode="numeric"
                          maxLength={1}
                          aria-label={`Digit ${i + 1}`}
                          autoComplete={i === 0 ? 'one-time-code' : 'off'}
                          value={d}
                          onChange={(e) => setDigit(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[i] && i > 0)
                              otpRefs.current[i - 1]?.focus();
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="btn-brand mt-6"
                      disabled={otp.join('').length < 6 || verifying}
                    >
                      {verifying ? (
                        <>
                          <i className="ri-loader-4-line animate-spin text-xl"></i>Verifying…
                        </>
                      ) : redirect ? (
                        <>
                          <i className="ri-check-line text-xl"></i>Redirecting…
                        </>
                      ) : (
                        'Verify and sign in'
                      )}
                    </button>
                  </form>
                  <p className="text-[14px] mt-5 text-center" style={{ color: 'var(--muted)' }}>
                    Didn't get it?{' '}
                    <button
                      type="button"
                      className="font-bold disabled:opacity-100"
                      style={{ color: 'var(--purple)' }}
                      disabled={timer > 0}
                      onClick={startOtp}
                    >
                      {timer > 0
                        ? `Resend code in 0:${String(timer).padStart(2, '0')}`
                        : 'Resend code'}
                    </button>
                  </p>
                </div>
              )}

              {step === 'org' && (
                <div>
                  <h2 className="font-head text-[28px] font-extrabold tracking-tight leading-tight">
                    Choose organization
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>
                      you@company.com
                    </span>{' '}
                    belongs to more than one organization. Pick where to continue.
                  </p>
                  <div
                    className="mt-6 flex flex-col gap-3"
                    role="radiogroup"
                    aria-label="Organizations"
                  >
                    {ORGS.map((o, i) => (
                      <button
                        key={o.name}
                        type="button"
                        role="radio"
                        aria-checked={org === i}
                        onClick={() => setOrg(i)}
                        className="org-card p-4 flex items-center gap-3.5"
                      >
                        <span
                          className="size-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: o.bg, color: o.fg }}
                        >
                          <i className={o.icon}></i>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-head text-[15px] font-bold">{o.name}</span>
                          <span className="block text-[13px]" style={{ color: 'var(--muted)' }}>
                            {o.meta}
                          </span>
                        </span>
                        <span className="radio"></span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-brand mt-6"
                    disabled={!!redirect}
                    onClick={() => goAs(ORGS[org].role, ORGS[org].meta.split(' · ')[1])}
                  >
                    {redirect ? (
                      <>
                        <i className="ri-check-line text-xl"></i>Redirecting to {redirect}…
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('signin')}
                    className="block mx-auto mt-4 text-[14px] font-bold"
                    style={{ color: 'var(--purple)' }}
                  >
                    Use a different account
                  </button>
                </div>
              )}
            </div>
          </div>

          <footer
            className="flex items-center justify-center gap-2 text-[13px] pt-2"
            style={{ color: 'var(--muted)' }}
          >
            <a href="#" className="font-semibold hover:underline">
              Terms
            </a>
            <span aria-hidden="true">·</span>
            <a href="#" className="font-semibold hover:underline">
              Privacy
            </a>
            <span aria-hidden="true">·</span>
            <a href="#" className="font-semibold hover:underline">
              Help center
            </a>
          </footer>
        </section>
      </div>
    </div>
  );
}
