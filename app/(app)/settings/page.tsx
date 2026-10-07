import type { Metadata } from "next";

import AccountView from "@/features/settings/AccountView";

export const metadata: Metadata = { title: "My Account" };

export default function SettingsPage() {
  return <AccountView />;
}
