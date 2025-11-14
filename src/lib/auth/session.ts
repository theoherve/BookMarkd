import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";

export const getCurrentSession = () => {
  noStore();
  return getServerSession(authOptions);
};

