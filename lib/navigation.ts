import type SvgIcon from "@mui/material/SvgIcon";
import {
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  CardMembershipOutlined,
  DashboardOutlined,
  GroupsOutlined,
  HelpOutlineOutlined,
  InsightsOutlined,
  MedicalInformationOutlined,
  PeopleAltOutlined,
  ReceiptLongOutlined,
  SelfImprovementOutlined,
  SupportAgentOutlined,
} from "@mui/icons-material";

import type { Permission, Terminology } from "@/types";

export type IconComponent = typeof SvgIcon;

export interface NavItem {
  label: string | ((terms: Terminology) => string);
  href: string;
  icon: IconComponent;
  permission: Permission;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: DashboardOutlined, permission: "dashboard.view" }],
  },
  {
    title: "Clinical",
    items: [
      { label: "Appointments", href: "/appointments", icon: CalendarMonthOutlined, permission: "appointments.view" },
      { label: "Patients", href: "/patients", icon: PeopleAltOutlined, permission: "patients.view" },
      { label: (t) => t.consultations, href: "/consultations", icon: MedicalInformationOutlined, permission: "consultations.view" },
      { label: (t) => t.services, href: "/treatments", icon: SelfImprovementOutlined, permission: "services.view" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Billing", href: "/billing", icon: ReceiptLongOutlined, permission: "billing.view" },
      { label: "Expenses", href: "/expenses", icon: AccountBalanceWalletOutlined, permission: "expenses.view" },
      { label: "Reports", href: "/reports", icon: InsightsOutlined, permission: "reports.view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Members", href: "/members", icon: GroupsOutlined, permission: "members.view" },
      { label: "Permissions", href: "/permissions", icon: AdminPanelSettingsOutlined, permission: "permissions.manage" },
      { label: "Clinic", href: "/clinic", icon: BusinessOutlined, permission: "clinic.view" },
      { label: "Subscription", href: "/subscription", icon: CardMembershipOutlined, permission: "subscription.view" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "FAQs", href: "/faqs", icon: HelpOutlineOutlined, permission: "support.view" },
      { label: "Support", href: "/support", icon: SupportAgentOutlined, permission: "support.view" },
    ],
  },
];

export function navLabel(item: NavItem, terms: Terminology): string {
  return typeof item.label === "function" ? item.label(terms) : item.label;
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Route-level permission (create/edit routes need the matching permission). */
export function routePermission(pathname: string): Permission | null {
  const item = NAV_SECTIONS.flatMap((section) => section.items).find((nav) => isNavActive(pathname, nav.href));
  if (!item) return null;
  const area = item.permission.split(".")[0];
  if (pathname.endsWith("/new")) {
    if (area === "members") return "members.create";
    return `${area}.create` as Permission;
  }
  if (pathname.endsWith("/edit")) return `${area}.edit` as Permission;
  return item.permission;
}
