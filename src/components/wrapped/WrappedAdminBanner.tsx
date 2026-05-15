import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentWrappedYear } from "@/lib/wrapped/utils";

const WrappedAdminBanner = () => {
  const currentYear = getCurrentWrappedYear();

  return (
    <Card className="relative overflow-hidden border-[#d6b087]/40 bg-[radial-gradient(ellipse_at_top_right,#f3e3cb_0%,#fdfaf5_55%,#fdfaf5_100%)] dark:border-[#c89a6f]/30 dark:bg-[radial-gradient(ellipse_at_top_right,#2f241c_0%,#1a1410_55%,#1a1410_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply dark:opacity-30 dark:mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 20%, rgba(182,111,75,0.15), transparent 50%)",
        }}
      />
      <CardContent className="relative flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f1c11] text-[#fdfaf5] dark:bg-[#c89a6f] dark:text-[#130c08]">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6b5747] dark:text-[#bda68f]">
              Bookmarkd Wrapped · {currentYear}
            </p>
            <h3 className="text-lg font-semibold leading-snug text-[#2f1c11] dark:text-[#f7f1ea]">
              Votre année de lecture, en un clin d&apos;œil
            </h3>
          </div>
        </div>
        <Link href={`/wrapped/${currentYear}`} className="self-stretch md:self-auto">
          <Button
            size="lg"
            className="group w-full bg-[#2f1c11] text-[#fdfaf5] hover:bg-[#1f140d] md:w-auto dark:bg-[#c89a6f] dark:text-[#130c08] dark:hover:bg-[#b9885d]"
          >
            Voir mon Wrapped
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default WrappedAdminBanner;
