import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth/session";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin · BookMarkd",
    template: "%s · Admin · BookMarkd",
  },
  robots: { index: false, follow: false },
};

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getCurrentSession();
  if (!session?.user?.isAdmin) redirect("/");

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
};

export default AdminLayout;
