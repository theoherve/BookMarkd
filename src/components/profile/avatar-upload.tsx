"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AvatarUploadProps = {
  currentAvatarUrl: string | null;
  avatarInitials: string;
  onUploadSuccess?: () => void;
};

const AvatarUpload = ({
  currentAvatarUrl,
  avatarInitials,
  onUploadSuccess,
}: AvatarUploadProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valider le type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      return;
    }

    // Valider la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Le fichier est trop volumineux. Taille maximale : 5MB.");
      return;
    }

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/storage/avatars/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      // Succès
      setPreviewUrl(null);
      router.refresh();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload de l'avatar",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Avatar"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
              {avatarInitials}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="avatar-upload">Photo de profil</Label>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading}
            >
              {isUploading ? "Upload en cours..." : "Choisir une photo"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Formats acceptés : JPEG, PNG, WebP. Taille maximale : 5MB.
            </p>
          </div>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default AvatarUpload;
