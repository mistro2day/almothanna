import { FormEvent, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  WifiOff,
} from 'lucide-react';
import axios from 'axios';
import { apiClient } from '../api/apiClient';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const digitMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const normalizeIdentifier = (value: string) =>
  value
    .replace(/[٠-٩]/g, (digit) => digitMap[digit] ?? digit)
    .replace(/\s+/g, '')
    .trim();

const sanitizeInput = (value: string) =>
  value.replace(/[٠-٩]/g, (digit) => digitMap[digit] ?? digit);

const defaultCredentials = {
  email: 'admin@almothanna.com',
  phone: '0912345678',
  password: 'admin123',
};

interface LoginResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    role: Role;
  };
  token: string;
}

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const isOffline = useAuthStore((state) => state.isOffline);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);

  const isEmail = useMemo(() => identifier.includes('@'), [identifier]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      identifier: normalizeIdentifier(identifier),
      password: password.trim(),
    };

    if (!payload.identifier || !payload.password) {
      setError('يرجى إدخال البريد أو الهاتف وكلمة المرور');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', payload);
      login(response.data.user, response.data.token);
      setShowSuccessPulse(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
          setError(backendMessage);
        } else if (Array.isArray(backendMessage) && backendMessage.length > 0) {
          setError(String(backendMessage[0]));
        } else if (err.response?.status === 404) {
          setError('خدمة تسجيل الدخول غير متاحة. تحقق من تشغيل backend على المنفذ الصحيح.');
        } else if (!err.response) {
          setError('تعذر الوصول إلى الخادم. تحقق من VITE_API_URL وتشغيل backend.');
        } else {
          setError('تعذر تسجيل الدخول. تأكد من صحة البيانات.');
        }
      } else {
        setError('حدث خطأ غير متوقع أثناء تسجيل الدخول.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDefaultEmail = () => {
    setIdentifier(defaultCredentials.email);
    setPassword(defaultCredentials.password);
    setError(null);
  };

  const applyDefaultPhone = () => {
    setIdentifier(defaultCredentials.phone);
    setPassword(defaultCredentials.password);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-primary)] px-5 py-12">
      <div className="glow-bg top-[-20%] right-[-10%] h-[420px] w-[420px] bg-emerald-500/20" />
      <div className="glow-bg bottom-[-20%] left-[-10%] h-[420px] w-[420px] bg-teal-500/15" />

      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 md:flex-row md:items-stretch">
        <div className="glass-card relative w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border-color)] p-10 shadow-2xl" dir="rtl">
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute -left-24 top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-700 ${
                showSuccessPulse ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500/80">
                    almothanna pharma erp
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
                  أهلًا بك مجددًا
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  سجّل دخولك باستخدام البريد الإلكتروني أو رقم الهاتف المسجّل لدينا.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                <ShieldCheck className="h-8 w-8" />
              </div>
            </div>

            {isOffline && (
              <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4" />
                  <span>الاتصال ضعيف. سيتم التحقق فور عودة الشبكة.</span>
                </div>
                <span className="text-rose-300">وضع أوفلاين</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <label className="space-y-2 text-right text-sm font-semibold text-[var(--text-secondary)]">
                <span>البريد الإلكتروني أو رقم الهاتف</span>
                <div
                  className={`flex items-center gap-3 rounded-2xl border border-transparent bg-[var(--glass-bg)] px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:shadow-lg focus-within:shadow-emerald-500/20 ${
                    error ? 'border-rose-400/70' : 'border-[var(--glass-border)]'
                  }`}
                >
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(sanitizeInput(event.target.value))}
                    placeholder="example@almothanna.com أو 09XXXXXXXX"
                    className="flex-1 bg-transparent text-right text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                    dir="rtl"
                    inputMode="email"
                    autoComplete="username"
                  />
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                    {isEmail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  </div>
                </div>
              </label>

              <label className="space-y-2 text-right text-sm font-semibold text-[var(--text-secondary)]">
                <span>كلمة المرور</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:shadow-lg focus-within:shadow-emerald-500/20">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-right text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                    dir="rtl"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 transition-colors hover:bg-emerald-500/20"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                <div className="flex gap-2" dir="ltr">
                  <button
                    type="button"
                    onClick={applyDefaultEmail}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-500 transition-all hover:border-emerald-500 hover:bg-emerald-500/20"
                  >
                    admin@almothanna.com
                  </button>
                  <button
                    type="button"
                    onClick={applyDefaultPhone}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-500 transition-all hover:border-emerald-500 hover:bg-emerald-500/20"
                  >
                    0912345678
                  </button>
                </div>
                <span className="text-right text-xs text-[var(--text-secondary)]">
                  كلمة المرور الافتراضية: <b>admin123</b>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col items-end gap-6 text-right">
          <button
            onClick={toggleTheme}
            className="self-start rounded-full border border-[var(--border-color)]/60 bg-[var(--glass-bg)] px-5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-emerald-400/60"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>تفعيل الوضع النهاري</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <span>تفعيل الوضع الليلي</span>
                </>
              )}
            </span>
          </button>

          <div className="glass-card w-full rounded-3xl border border-[var(--border-color)] px-8 py-10">
            <div className="flex flex-col gap-6" dir="rtl">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-sm font-semibold">نظام التوزيع الدوائي</span>
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                  premium access
                </span>
              </div>
              <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)]">
                إدارة المخزون، الفواتير، والموردين بكفاءة غير مسبوقة.
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                يدعم النظام العمل دون اتصال، تنبيهات انتهاء الصلاحية، ولوحات تحكم مخصصة للمبيعات والموردين مع تجربة عربية فاخرة.
              </p>
              <div className="flex items-center justify-end gap-3 text-sm text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
                <span>دخول آمن - مصادق عليه بالـ JWT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
