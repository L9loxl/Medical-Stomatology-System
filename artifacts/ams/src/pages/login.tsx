import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Stethoscope, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth-provider";
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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("ahmed@amsclinic.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}`);
        setLocation("/dashboard");
      },
      onError: () => {
        toast.error("Invalid credentials. Use any demo account below.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent opacity-90" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-sidebar-primary/10"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-lg">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight">AMS</h1>
                <p className="text-sidebar-foreground/50 text-sm">Advanced Medical Stomatology</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight mb-4">
              Next-Generation<br />Dental Management
            </h2>
            <p className="text-sidebar-foreground/60 text-lg leading-relaxed max-w-md">
              Precision-engineered clinic management platform for dental professionals who demand excellence.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { label: "Patients", value: "500+" },
                { label: "Appointments", value: "98%" },
                { label: "Clinics", value: "50+" },
                { label: "Uptime", value: "99.9%" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-sidebar-accent/50 rounded-xl p-4 border border-sidebar-border">
                  <p className="text-2xl font-bold text-sidebar-primary">{value}</p>
                  <p className="text-sidebar-foreground/50 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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

          <h2 className="text-2xl font-bold text-foreground mb-1">Sign in</h2>
          <p className="text-muted-foreground text-sm mb-8">Access your clinic management dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="doctor@clinic.com"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  Signing in...
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" /> Demo accounts
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => { setEmail(account.email); setPassword("demo123"); }}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                  data-testid={`button-demo-${account.role.toLowerCase()}`}
                >
                  <p className="text-xs font-semibold text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.role}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Developer: Khaled Aknoun &middot; +963934101588
          </p>
        </motion.div>
      </div>
    </div>
  );
}
