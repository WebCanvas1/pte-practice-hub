import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgePercent,
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  Gauge,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCog,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean | undefined;
}

export const publicNav: { label: string; to: string }[] = [
  { label: "Home", to: "/" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Test Modules", to: "/test-modules" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export const legalNav: { label: string; to: string }[] = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms and Conditions", to: "/terms-and-conditions" },
  { label: "Disclaimer", to: "/disclaimer" },
];

export const studentNav: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, exact: true },
  { label: "Browse Tests", to: "/student/browse-tests", icon: BookOpen },
  { label: "My Tests", to: "/student/my-tests", icon: ListChecks },
  { label: "Test History", to: "/student/test-history", icon: History },
  { label: "Progress", to: "/student/progress", icon: BarChart3 },
  { label: "AI Recommendations", to: "/student/ai-recommendations", icon: Sparkles },
  { label: "Purchases", to: "/student/purchases", icon: CreditCard },
  { label: "Profile", to: "/student/profile", icon: UserCog },
  { label: "Account Settings", to: "/student/account-settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin", icon: Gauge, exact: true },
  { label: "Questions", to: "/admin/questions", icon: FileText },
  { label: "Test Templates", to: "/admin/test-templates", icon: FileStack },
  { label: "Content Imports", to: "/admin/content-imports", icon: Upload },
  { label: "Students", to: "/admin/students", icon: GraduationCap },
  { label: "Test Attempts", to: "/admin/test-attempts", icon: ClipboardList },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "AI Evaluations", to: "/admin/ai-evaluations", icon: Sparkles },
  { label: "Coupons", to: "/admin/coupons", icon: BadgePercent },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Platform Settings", to: "/admin/platform-settings", icon: Settings },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: ShieldCheck },
];

export const navIcons = { Users, Activity };
