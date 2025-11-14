import { redirect } from "next/navigation";

import ListCreateForm from "@/components/lists/list-create-form";

import { getCurrentSession } from "@/lib/auth/session";

const CreateListPage = async () => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/lists/create");
  }

  const ownerName = session.user.name ?? "Vous";

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <ListCreateForm ownerName={ownerName} />
    </section>
  );
};

export default CreateListPage;

