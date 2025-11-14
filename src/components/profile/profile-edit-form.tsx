"use client";

import { FormEvent, useState, useTransition } from "react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/server/actions/profile";

type ProfileEditFormProps = {
  initialDisplayName: string;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  avatarInitials: string;
};

const ProfileEditForm = ({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  avatarInitials,
}: ProfileEditFormProps) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      if (result.success) {
        setFeedback("Profil mis à jour avec succès.");
        setTimeout(() => {
          setFeedback(null);
        }, 3000);
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Modifier mon profil
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Mettez à jour vos informations personnelles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                  {avatarInitials}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatarUrl">URL de la photo de profil</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Entrez l&apos;URL d&apos;une image pour votre photo de profil.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nom affiché</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Votre nom"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Parlez-nous de votre univers littéraire..."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 caractères
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>

          {feedback ? (
            <p
              className={`text-sm text-center ${
                feedback.includes("succès")
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {feedback}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEditForm;

