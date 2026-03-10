import { getTagsList, getOrphanedTags } from "@/features/admin/server/get-tags-list";
import { getFeelingsList, getOrphanedFeelings } from "@/features/admin/server/get-feelings-list";
import { AdminTagsSection } from "@/components/admin/tags/tags-section";
import { AdminFeelingsSection } from "@/components/admin/tags/feelings-section";

const AdminTagsPage = async () => {
  const [tags, orphanedTags, feelings, orphanedFeelings] = await Promise.all([
    getTagsList(),
    getOrphanedTags(),
    getFeelingsList(),
    getOrphanedFeelings(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tags & Ressentis</h1>
        <p className="text-sm text-muted-foreground">Gérez les tags et les mots-clés de ressentis</p>
      </div>
      <AdminTagsSection tags={tags} orphanedTags={orphanedTags} />
      <AdminFeelingsSection feelings={feelings} orphanedFeelings={orphanedFeelings} />
    </div>
  );
};

export default AdminTagsPage;
