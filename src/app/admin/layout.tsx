import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth/session";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { getPendingEditorialListsCount } from "@/features/editorial/server/get-admin-editorial-lists";
import { getDraftYearsCount } from "@/features/awards/server/queries";

export const metadata: Metadata = {
  title: {
    default: "Admin · BookMarkd",
    template: "%s · Admin · BookMarkd",
  },
  robots: { index: false, follow: false },
};

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, pendingEditorialCount, pendingAwardsCount] = await Promise.all([
    getCurrentSession(),
    getPendingEditorialListsCount(),
    getDraftYearsCount(),
  ]);
  if (!session?.user?.isAdmin) redirect("/");

  return (
    <AdminLayoutShell
      pendingEditorialCount={pendingEditorialCount}
      pendingAwardsCount={pendingAwardsCount}
    >
      {children}
    </AdminLayoutShell>
  );
};

export default AdminLayout;
