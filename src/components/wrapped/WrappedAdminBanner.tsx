import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentWrappedYear } from "@/lib/wrapped/utils";

const WrappedAdminBanner = () => {
  const currentYear = getCurrentWrappedYear();

  return (
    <Card className="border-2 border-gradient-to-r from-purple-500 to-pink-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardContent className="flex flex-col items-center gap-4 p-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Bookmarkd Wrapped {currentYear}
            </h3>
            <p className="text-sm text-muted-foreground">
              Découvrez vos statistiques de lecture de l&apos;année
            </p>
          </div>
        </div>
        <Link href={`/wrapped/${currentYear}`}>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            Voir mon Wrapped
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default WrappedAdminBanner;
