import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, Eye, EyeOff, Lock, Mail, Shield,
  LayoutDashboard, Boxes, Sparkles, LayoutGrid,
} from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { email: "ahmed@amsclinic.com", name: "Dr. Ahmed Al-Rashid", role: "Doctor" },
  { email: "sara@amsclinic.com", name: "Dr. Sara Khalil", role: "Doctor" },
  { email: "rania@amsclinic.com", name: "Rania Hassan", role: "Receptionist" },
  { email: "omar@amsclinic.com", name: "Omar Faris", role: "Administrator" },
];

/* ---------- Interactive white-coat cat doctor that follows the mouse ---------- */
function CatDoctor({ peeking = false }: { peeking?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const mag = Math.min(6, dist / 18);
      setPupil({ x: (dx / dist) * mag, y: (dy / dist) * mag });
      setTilt(Math.max(-7, Math.min(7, dx / 45)));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setBlink(true);
      timeoutId = setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => {
      clearInterval(id);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={wrapRef} className="w-[230px] h-[250px] select-none" data-testid="cat-doctor">
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, -1.4, 0, 1.4, 0] }}
        transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: "100%", height: "100%" }}
      >
      <motion.svg
        viewBox="0 0 220 240"
        width="100%"
        height="100%"
        animate={{ rotate: tilt }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="fur" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8edf5" />
          </radialGradient>
          <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dfe6f0" />
          </linearGradient>
          <radialGradient id="mirror" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#e8f6ff" />
            <stop offset="45%" stopColor="#9fd2f0" />
            <stop offset="100%" stopColor="#3f7fa8" />
          </radialGradient>
          <linearGradient id="scope" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Coat / shoulders */}
        <path d="M40 240 Q42 178 110 172 Q178 178 180 240 Z" fill="url(#coat)" stroke="#cdd6e3" strokeWidth="2" />
        {/* Lapels */}
        <path d="M92 176 L110 210 L96 176 Z" fill="#eef2f8" stroke="#cdd6e3" strokeWidth="1.5" />
        <path d="M128 176 L110 210 L124 176 Z" fill="#eef2f8" stroke="#cdd6e3" strokeWidth="1.5" />
        {/* Stethoscope */}
        <path d="M96 178 C 84 200, 78 214, 96 226" fill="none" stroke="url(#scope)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M124 178 C 138 198, 150 206, 150 220" fill="none" stroke="url(#scope)" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="150" cy="224" r="9" fill="#cbd5e1" stroke="hsl(var(--primary))" strokeWidth="3" />

        {/* Ears */}
        <path d="M54 70 L44 22 L92 52 Z" fill="url(#fur)" stroke="#d7dee9" strokeWidth="2" />
        <path d="M166 70 L176 22 L128 52 Z" fill="url(#fur)" stroke="#d7dee9" strokeWidth="2" />
        <path d="M58 62 L52 36 L80 53 Z" fill="#ffc9d4" />
        <path d="M162 62 L168 36 L140 53 Z" fill="#ffc9d4" />

        {/* Head */}
        <ellipse cx="110" cy="112" rx="72" ry="64" fill="url(#fur)" stroke="#d7dee9" strokeWidth="2" />

        {/* Dentist head mirror band + reflector */}
        <path d="M70 72 Q110 56 150 72" fill="none" stroke="#9aa7ba" strokeWidth="5" strokeLinecap="round" />
        <circle cx="110" cy="62" r="17" fill="url(#mirror)" stroke="#7c93a8" strokeWidth="2.5" />
        <circle cx="110" cy="62" r="4" fill="#2c4a5e" />

        {/* Cheeks */}
        <ellipse cx="74" cy="128" rx="13" ry="9" fill="#ffd2dc" opacity="0.7" />
        <ellipse cx="146" cy="128" rx="13" ry="9" fill="#ffd2dc" opacity="0.7" />

        {/* Eyes — open & tracking, or shyly shut when the password is shown */}
        {peeking ? (
          <g stroke="#3a3f4a" strokeWidth="3.4" strokeLinecap="round" fill="none">
            <path d="M75 110 Q88 121 101 110" />
            <path d="M119 110 Q132 121 145 110" />
          </g>
        ) : (
          <>
            <g>
              <ellipse cx="88" cy="112" rx="15" ry={blink ? 2 : 17} fill="#ffffff" stroke="#d7dee9" strokeWidth="1.5" />
              {!blink && (
                <g transform={`translate(${pupil.x}, ${pupil.y})`}>
                  <circle cx="88" cy="112" r="9.5" fill="#3a3f4a" />
                  <circle cx="88" cy="112" r="5" fill="#11141a" />
                  <circle cx="84.5" cy="108.5" r="2.6" fill="#ffffff" />
                </g>
              )}
            </g>
            <g>
              <ellipse cx="132" cy="112" rx="15" ry={blink ? 2 : 17} fill="#ffffff" stroke="#d7dee9" strokeWidth="1.5" />
              {!blink && (
                <g transform={`translate(${pupil.x}, ${pupil.y})`}>
                  <circle cx="132" cy="112" r="9.5" fill="#3a3f4a" />
                  <circle cx="132" cy="112" r="5" fill="#11141a" />
                  <circle cx="128.5" cy="108.5" r="2.6" fill="#ffffff" />
                </g>
              )}
            </g>
          </>
        )}

        {/* Nose */}
        <path d="M104 134 L116 134 L110 142 Z" fill="#ff8fa3" stroke="#e76e85" strokeWidth="1" />
        {/* Mouth */}
        <path d="M110 142 Q102 152 94 146" fill="none" stroke="#b9c2d0" strokeWidth="2" strokeLinecap="round" />
        <path d="M110 142 Q118 152 126 146" fill="none" stroke="#b9c2d0" strokeWidth="2" strokeLinecap="round" />

        {/* Whiskers */}
        <g stroke="#cdd6e3" strokeWidth="1.6" strokeLinecap="round">
          <path d="M62 132 L26 126" />
          <path d="M62 138 L28 140" />
          <path d="M158 132 L194 126" />
          <path d="M158 138 L192 140" />
        </g>

        {/* Shy paws that cover the eyes when the password is revealed */}
        {peeking && (
          <>
            {[88, 132].map((ex, i) => (
              <motion.g
                key={ex}
                initial={{ y: 70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 17, delay: i * 0.05 }}
              >
                <ellipse cx={ex} cy={112} rx={23} ry={21} fill="url(#fur)" stroke="#d7dee9" strokeWidth={2} />
                <ellipse cx={ex} cy={120} rx={9} ry={6} fill="#ffd2dc" opacity={0.8} />
                <circle cx={ex - 8} cy={108} r={2.6} fill="#ffc9d4" />
                <circle cx={ex} cy={105} r={2.6} fill="#ffc9d4" />
                <circle cx={ex + 8} cy={108} r={2.6} fill="#ffc9d4" />
              </motion.g>
            ))}
          </>
        )}
      </motion.svg>
      </motion.div>
    </div>
  );
}

/* ---------- Rotating feature slides (changes every 2 seconds) ---------- */
function RotatingSlides() {
  const { t } = useI18n();
  const slides = [
    { icon: LayoutDashboard, title: t.slide1Title, text: t.slide1Text },
    { icon: Boxes, title: t.slide2Title, text: t.slide2Text },
    { icon: Sparkles, title: t.slide3Title, text: t.slide3Text },
    { icon: LayoutGrid, title: t.slide4Title, text: t.slide4Text },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 2000);
    return () => clearInterval(id);
  }, [slides.length]);

  const Active = slides[idx].icon;

  return (
    <div className="w-full max-w-md">
      <div className="min-h-[150px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15"
          >
            <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center mb-4 shadow-lg">
              <Active className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1.5">{slides[idx].title}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{slides[idx].text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-7 bg-sidebar-primary" : "w-1.5 bg-white/30"}`}
            aria-label={`slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const [email, setEmail] = useState("ahmed@amsclinic.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user, data.token);
        toast.success(`${t.welcomeBack}, ${data.user.name}`);
        setLocation("/dashboard");
      },
      onError: () => {
        toast.error(t.invalidCredentials);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left interactive panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent" />
        {/* Animated gradient blobs */}
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-sidebar-primary/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-sidebar-primary/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-xl">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight">AMS</h1>
              <p className="text-sidebar-foreground/50 text-sm">Advanced Medical Stomatology</p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <CatDoctor peeking={showPassword} />
          </div>

          <RotatingSlides />
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">AMS</p>
              <p className="text-xs text-muted-foreground">Advanced Medical Stomatology</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">{t.signIn}</h2>
          <p className="text-muted-foreground text-sm mb-8">{t.signInDesc}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailAddress}</Label>
              <div className="relative">
                <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 rtl:pl-3 rtl:pr-9"
                  placeholder="doctor@clinic.com"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 rtl:pl-10 rtl:pr-9"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {t.signingIn}
                </span>
              ) : t.signIn}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" /> {t.demoAccounts}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => { setEmail(account.email); setPassword("demo123"); }}
                  className="text-start p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                  data-testid={`button-demo-${account.role.toLowerCase()}`}
                >
                  <p className="text-xs font-semibold text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.role}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            {t.developer}: Khaled Aknoun &middot; +963934101588
          </p>
        </motion.div>
      </div>
    </div>
  );
}
