"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type AddBookCoverButtonProps = {
  bookId: string;
  className?: string;
};

const AddBookCoverButton = ({ bookId, className }: AddBookCoverButtonProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErrorMessage(null);

    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Le fichier est trop volumineux. Taille maximale : 5 Mo.");
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCoverFile(null);
      setCoverPreviewUrl(null);
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async () => {
    if (!coverFile) {
      setErrorMessage("Veuillez sélectionner une image.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("bookId", bookId);
      formData.append("file", coverFile);

      const response = await fetch("/api/storage/covers/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          typeof data.error === "string" ? data.error : "Erreur lors de l’envoi de la couverture.",
        );
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setErrorMessage("Erreur lors de l’envoi de la couverture.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div
        className={`flex min-h-[280px] w-full flex-col items-center justify-center gap-3 p-4 ${className ?? ""}`}
      >
        <p className="text-sm text-muted-foreground">Pas de couverture</p>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            aria-label="Ajouter une couverture à ce livre"
          >
            Ajouter une couverture
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une couverture</DialogTitle>
          <DialogDescription>
            Choisissez une image (JPEG, PNG ou WebP, 5 Mo max) pour la couverture de ce livre.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {coverPreviewUrl ? (
                <Image
                  src={coverPreviewUrl}
                  alt="Aperçu de la couverture"
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Aperçu
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverFileChange}
                className="hidden"
                aria-label="Choisir une image pour la couverture"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFileInputClick}
                disabled={isUploading}
              >
                {coverFile ? coverFile.name : "Choisir une photo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Formats : JPEG, PNG, WebP. Max 5 Mo.
              </p>
            </div>
          </div>
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!coverFile || isUploading}
            aria-busy={isUploading}
          >
            {isUploading ? "Envoi en cours…" : "Enregistrer la couverture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookCoverButton;
