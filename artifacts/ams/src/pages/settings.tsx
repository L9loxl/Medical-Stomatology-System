import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Building2, Save, Moon, Sun, Monitor
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "clinic", label: "Clinic", icon: Building2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    appointments: true, payments: true, emergencies: true, reports: false,
  });

  return (
    <div className="p-6 max-w-[1200px]">
      <h1 className="ams-page-title mb-6">Settings</h1>

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
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
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
                  <Input defaultValue="+963934101587" data-testid="input-clinic-phone" />
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
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
              </Button>
            </div>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Customize the look and feel</p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((t) => {
                    const icons = { light: Sun, dark: Moon, system: Monitor };
                    const Icon = icons[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          theme === t ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                        )}
                        data-testid={`button-theme-${t}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium capitalize">{t}</span>
                        {theme === t && <Badge className="text-xs px-1.5 py-0">Active</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-1 block">Accent Colors</Label>
                <p className="text-xs text-muted-foreground mb-3">Coming soon — color customization</p>
                <div className="flex gap-2">
                  {["hsl(199,89%,50%)", "hsl(142,71%,45%)", "hsl(217,91%,60%)", "hsl(280,65%,60%)", "hsl(38,92%,50%)"].map((c) => (
                    <div
                      key={c}
                      className="w-8 h-8 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
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
                <h2 className="text-lg font-semibold">Security</h2>
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
