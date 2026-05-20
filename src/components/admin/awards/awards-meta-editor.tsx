"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateAwardsYearMeta } from "@/server/actions/admin/awards";

type Props = {
  year: number;
  initialTheme: string | null;
  initialIntro: string | null;
};

export const AwardsMetaEditor = ({
  year,
  initialTheme,
  initialIntro,
}: Props) => {
  const [theme, setTheme] = useState(initialTheme ?? "");
  const [intro, setIntro] = useState(initialIntro ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    startTransition(async () => {
      const result = await updateAwardsYearMeta(year, {
        theme: theme.trim() === "" ? null : theme,
        intro: intro.trim() === "" ? null : intro,
      });
      if (!result.success) window.alert(result.message);
      else router.refresh();
    });
  };

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-card/80 p-6 backdrop-blur">
      <h2 className="text-lg font-semibold">Présentation de l’édition</h2>
      <div className="space-y-2">
        <Label htmlFor="awards-theme">Thème (optionnel)</Label>
        <Input
          id="awards-theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={`Awards ${year} — l’année des nouvelles voix`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="awards-intro">Introduction (optionnel)</Label>
        <Textarea
          id="awards-intro"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          placeholder="Un mot d’intro affiché en haut de la page publique."
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </section>
  );
};
