import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "ar";

const en = {
  // Nav
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  financial: "Financial",
  medicalImaging: "Medical Imaging",
  dentalChart: "Dental Chart",
  reports: "Reports",
  settings: "Settings",
  logout: "Logout",
  // Common
  save: "Save Changes",
  cancel: "Cancel",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  search: "Search",
  filter: "Filter",
  loading: "Loading...",
  // Patients
  newPatient: "Add Patient",
  totalPatients: "Total Patients",
  // Appointments
  newAppointment: "New Appointment",
  todayAppointments: "Today's Appointments",
  schedule: "Schedule",
  // Financial
  revenue: "Revenue",
  pending: "Pending",
  overdue: "Overdue",
  paid: "Paid",
  recordPayment: "Record Payment",
  // Settings
  profile: "Profile",
  clinic: "Clinic",
  appearance: "Appearance",
  notifications: "Notifications",
  security: "Security",
  language: "Language",
  colorTheme: "Color Theme",
  accentColor: "Accent Color",
  profilePhoto: "Profile Photo",
  uploadPhoto: "Upload Photo",
  removePhoto: "Remove Photo",
  dark: "Dark",
  light: "Light",
  system: "System",
  // Dashboard
  monthlyRevenue: "Monthly Revenue",
  activeEmergencies: "Active Emergencies",
  treatmentsThisMonth: "Treatments This Month",
  newPatientsThisMonth: "New Patients",
  completedTreatments: "Completed Treatments",
  today: "Today",
  recentActivity: "Recent Activity",
  // Status
  active: "Active",
  inactive: "Inactive",
  emergency: "Emergency",
  completed: "Completed",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  inProgress: "In Progress",
  cancelled: "Cancelled",
  // Dental chart
  dentalChartTitle: "Dental Chart",
  interactive3D: "Interactive 3D Model",
  interactive2D: "2D Chart",
  conditions: "Conditions",
  // AI
  aiRecommendations: "AI Clinical Intelligence",
  // Login
  signIn: "Sign in",
  signInDesc: "Access your clinic management dashboard",
  emailAddress: "Email address",
  password: "Password",
  demoAccounts: "Demo accounts",
};

const ar: typeof en = {
  // Nav
  dashboard: "لوحة التحكم",
  patients: "المرضى",
  appointments: "المواعيد",
  financial: "المالية",
  medicalImaging: "التصوير الطبي",
  dentalChart: "مخطط الأسنان",
  reports: "التقارير",
  settings: "الإعدادات",
  logout: "تسجيل الخروج",
  // Common
  save: "حفظ التغييرات",
  cancel: "إلغاء",
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
  search: "بحث",
  filter: "تصفية",
  loading: "جاري التحميل...",
  // Patients
  newPatient: "إضافة مريض",
  totalPatients: "إجمالي المرضى",
  // Appointments
  newAppointment: "موعد جديد",
  todayAppointments: "مواعيد اليوم",
  schedule: "جدولة",
  // Financial
  revenue: "الإيرادات",
  pending: "قيد الانتظار",
  overdue: "متأخر",
  paid: "مدفوع",
  recordPayment: "تسجيل دفعة",
  // Settings
  profile: "الملف الشخصي",
  clinic: "العيادة",
  appearance: "المظهر",
  notifications: "الإشعارات",
  security: "الأمان",
  language: "اللغة",
  colorTheme: "نظام الألوان",
  accentColor: "لون التمييز",
  profilePhoto: "صورة الملف الشخصي",
  uploadPhoto: "رفع صورة",
  removePhoto: "إزالة الصورة",
  dark: "داكن",
  light: "فاتح",
  system: "النظام",
  // Dashboard
  monthlyRevenue: "إيرادات الشهر",
  activeEmergencies: "حالات الطوارئ",
  treatmentsThisMonth: "علاجات الشهر",
  newPatientsThisMonth: "مرضى جدد",
  completedTreatments: "علاجات مكتملة",
  today: "اليوم",
  recentActivity: "النشاط الأخير",
  // Status
  active: "نشط",
  inactive: "غير نشط",
  emergency: "طارئ",
  completed: "مكتمل",
  scheduled: "مجدول",
  confirmed: "مؤكد",
  inProgress: "جاري",
  cancelled: "ملغي",
  // Dental chart
  dentalChartTitle: "مخطط الأسنان",
  interactive3D: "نموذج ثلاثي الأبعاد",
  interactive2D: "مخطط ثنائي الأبعاد",
  conditions: "الحالات",
  // AI
  aiRecommendations: "الذكاء الاصطناعي السريري",
  // Login
  signIn: "تسجيل الدخول",
  signInDesc: "الوصول إلى لوحة إدارة العيادة",
  emailAddress: "البريد الإلكتروني",
  password: "كلمة المرور",
  demoAccounts: "حسابات تجريبية",
};

const TRANSLATIONS = { en, ar };

type I18nContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof en;
  isRTL: boolean;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: en,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("ams-lang") as Language) ?? "en";
  });

  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("ams-lang", lang);
  }, [lang, isRTL]);

  const setLang = (l: Language) => setLangState(l);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang], isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
