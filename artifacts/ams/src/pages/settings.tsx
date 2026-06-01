import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Building2, Save, Moon, Sun, Monitor,
  Globe, Camera, X, Check
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useAccent, ACCENT_COLORS } from "@/components/accent-provider";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, profilePhoto, setProfilePhoto } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const { t, lang, setLang } = useI18n();
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    appointments: true, payments: true, emergencies: true, reports: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user
    ? `${user.name.split(" ")[0][0]}${user.name.split(" ").slice(-1)[0]?.[0] ?? ""}`
    : "?";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const SECTIONS = [
    { id: "profile",       label: t.profile,       icon: User },
    { id: "clinic",        label: t.clinic,         icon: Building2 },
    { id: "appearance",    label: t.appearance,     icon: Palette },
    { id: "notifications", label: t.notifications,  icon: Bell },
    { id: "security",      label: t.security,       icon: Shield },
  ];

  return (
    <div className="p-6 max-w-[1200px]">
      <h1 className="ams-page-title mb-6">{t.settings}</h1>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                activeSection === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              data-testid={`nav-settings-${id}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-card border border-card-border rounded-xl p-6 shadow-sm"
        >
          {/* Profile */}
          {activeSection === "profile" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Profile Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your account information</p>
              </div>
              <Separator />

              {/* Photo upload section */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/25">
                    {profilePhoto && <AvatarImage src={profilePhoto} alt={user?.name ?? ""} className="object-cover" />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t.profilePhoto}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF — max 4 MB</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      {t.uploadPhoto}
                    </Button>
                    {profilePhoto && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setProfilePhoto(null); toast.success("Photo removed"); }}>
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        {t.removePhoto}
                      </Button>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input defaultValue={user?.name} data-testid="input-profile-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} type="email" data-testid="input-profile-email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Input value={user?.role ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Specialization</Label>
                  <Input placeholder="e.g. Orthodontist, Periodontist" data-testid="input-specialization" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bio / Notes</Label>
                <textarea
                  className="w-full border border-input bg-transparent rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={3}
                  placeholder="Brief professional description..."
                  data-testid="input-bio"
                />
              </div>
              <Button onClick={() => toast.success("Profile saved")} data-testid="button-save-profile">
                <Save className="w-3.5 h-3.5 mr-1.5" /> {t.save}
              </Button>
            </div>
          )}

          {/* Clinic */}
          {activeSection === "clinic" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Clinic Information</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Update your clinic details</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Clinic Name</Label>
                  <Input defaultValue="Advanced Medical Stomatology" data-testid="input-clinic-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input defaultValue="+963934101588" data-testid="input-clinic-phone" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input defaultValue="contact@amsclinic.com" type="email" data-testid="input-clinic-email" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Input placeholder="Clinic address..." data-testid="input-clinic-address" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input defaultValue="USD" data-testid="input-currency" />
                </div>
                <div className="space-y-1.5">
                  <Label>Working Hours</Label>
                  <Input placeholder="e.g. 9am - 6pm" data-testid="input-working-hours" />
                </div>
              </div>
              <Button onClick={() => toast.success("Clinic info saved")} data-testid="button-save-clinic">
                <Save className="w-3.5 h-3.5 mr-1.5" /> {t.save}
              </Button>
            </div>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t.appearance}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Customize the look and feel</p>
              </div>
              <Separator />

              {/* Language */}
              <div>
                <Label className="text-sm font-medium mb-3 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> {t.language}
                </Label>
                <div className="flex gap-3">
                  {([
                    { code: "en" as const, label: "English", native: "English" },
                    { code: "ar" as const, label: "Arabic", native: "العربية" },
                  ]).map(({ code, label, native }) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); toast.success(`Language set to ${label}`); }}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all",
                        lang === code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className="text-lg font-bold">{code === "en" ? "EN" : "ع"}</span>
                      <span className="text-xs font-medium">{native}</span>
                      {lang === code && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />

              {/* Color Theme */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{t.colorTheme}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((th) => {
                    const icons = { light: Sun, dark: Moon, system: Monitor };
                    const labels = { light: t.light, dark: t.dark, system: t.system };
                    const Icon = icons[th];
                    return (
                      <button
                        key={th}
                        onClick={() => setTheme(th)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          theme === th ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                        data-testid={`button-theme-${th}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium capitalize">{labels[th]}</span>
                        {theme === th && <Badge className="text-xs px-1.5 py-0">Active</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator />

              {/* Accent Colors — fully working */}
              <div>
                <Label className="text-sm font-medium mb-1 block">{t.accentColor}</Label>
                <p className="text-xs text-muted-foreground mb-3">Changes the primary highlight color throughout the app</p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((ac) => (
                    <button
                      key={ac.id}
                      onClick={() => { setAccent(ac); toast.success(`Accent color set to ${ac.label}`); }}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-[72px]",
                        accent.id === ac.id ? "border-[var(--accent-swatch)] scale-105 shadow-md" : "border-border hover:border-[var(--accent-swatch)]"
                      )}
                      style={{ "--accent-swatch": ac.hex } as React.CSSProperties}
                      data-testid={`button-accent-${ac.id}`}
                    >
                      <div
                        className="w-9 h-9 rounded-full shadow-sm ring-2 ring-black/10"
                        style={{ backgroundColor: ac.hex }}
                      />
                      <span className="text-xs font-medium leading-none">{ac.label}</span>
                      {accent.id === ac.id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
                          style={{ backgroundColor: ac.hex }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{t.notifications}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Choose what you get notified about</p>
              </div>
              <Separator />
              <div className="space-y-4">
                {[
                  { key: "appointments", label: "Appointment Reminders", desc: "Get notified about upcoming and missed appointments" },
                  { key: "payments", label: "Payment Alerts", desc: "Receive alerts for overdue and pending payments" },
                  { key: "emergencies", label: "Emergency Cases", desc: "Immediate alerts for emergency patient cases" },
                  { key: "reports", label: "Weekly Reports", desc: "Receive weekly practice performance summaries" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(v) => setNotifications(n => ({ ...n, [key]: v }))}
                      data-testid={`switch-notify-${key}`}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => toast.success("Notification preferences saved")} data-testid="button-save-notifications">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Preferences
              </Button>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{t.security}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your password and security settings</p>
              </div>
              <Separator />
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••" data-testid="input-current-password" />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••" data-testid="input-new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="••••••••" data-testid="input-confirm-password" />
                </div>
                <Button onClick={() => toast.success("Password updated")} data-testid="button-change-password">
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Change Password
                </Button>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-1">Active Sessions</h3>
                <p className="text-xs text-muted-foreground">You are currently logged in on this device.</p>
                <div className="mt-3 flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-medium">Current session</p>
                    <p className="text-muted-foreground">Browser · Active now</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
