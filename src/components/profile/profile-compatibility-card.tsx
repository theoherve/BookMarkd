import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { UserCompatibility } from "@/features/profile/server/get-profile-suggestions";

type ProfileCompatibilityCardProps = {
  compatibility: UserCompatibility;
  profileDisplayName: string;
};

const ProfileCompatibilityCard = ({
  compatibility,
  profileDisplayName,
}: ProfileCompatibilityCardProps) => {
  return (
    <Card
      className="relative overflow-hidden border-2 border-accent/40 bg-linear-to-br from-accent/5 via-card to-card shadow-sm"
      aria-label={`Compatibilité avec ${profileDisplayName} : ${compatibility.score}%`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-5 w-5 text-accent-foreground"
            aria-hidden
          />
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Affinité avec {profileDisplayName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-4xl font-bold text-accent-foreground tabular-nums">
          {compatibility.score}%
        </p>
        <p className="text-sm text-muted-foreground">
          {compatibility.reason}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProfileCompatibilityCard;
