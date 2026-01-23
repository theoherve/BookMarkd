"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfile } from "@/server/actions/profile";
import AvatarUpload from "@/components/profile/avatar-upload";

type ProfileEditModalProps = {
  initialDisplayName: string;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  avatarInitials: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ProfileEditModal = ({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  avatarInitials,
  open,
  onOpenChange,
}: ProfileEditModalProps) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        bio: bio.trim() || null,
      });
      if (result.success) {
        setFeedback("Profil mis à jour avec succès.");
        router.refresh();
        setTimeout(() => {
          setFeedback(null);
          onOpenChange(false);
        }, 1500);
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Modifier mon profil
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Mettez à jour vos informations personnelles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <AvatarUpload
            currentAvatarUrl={initialAvatarUrl}
            avatarInitials={avatarInitials}
            onUploadSuccess={() => {
              router.refresh();
            }}
          />

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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>

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
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;

