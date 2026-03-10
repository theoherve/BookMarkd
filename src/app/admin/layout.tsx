import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUserAdminStatus } from "@/lib/auth/admin";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin · BookMarkd",
    template: "%s · Admin · BookMarkd",
  },
  robots: { index: false, follow: false },
};

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const isAdmin = await getCurrentUserAdminStatus();
  if (!isAdmin) redirect("/");

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
};

export default AdminLayout;
