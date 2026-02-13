"use client";

import { ChangeEvent, FormEvent, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { createBook } from "@/server/actions/book";
import { generateBookSlug } from "@/lib/slug";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const BookCreateForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverSource, setCoverSource] = useState<"upload" | "url">("upload");

  // Récupérer les valeurs des query params pour pré-remplir le formulaire
  const initialTitle = searchParams.get("title") || "";
  const initialAuthor = searchParams.get("author") || "";

  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState(initialAuthor);

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
      setErrorMessage("Le fichier est trop volumineux. Taille maximale : 5Mo.");
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverSourceChange = (source: "upload" | "url") => {
    setCoverSource(source);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrorMessage(null);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    if (coverFile && coverSource === "upload") {
      formData.delete("coverUrl");
      formData.append("coverFile", coverFile);
    } else {
      formData.delete("coverFile");
    }

    startTransition(async () => {
      setErrorMessage(null);
      const result = await createBook(formData);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      // Générer le slug à partir des données du formulaire
      const formTitle = formData.get("title")?.toString().trim() || "";
      const formAuthor = formData.get("author")?.toString().trim() || "";
      
      if (formTitle && formAuthor) {
        const slug = generateBookSlug(formTitle, formAuthor);
        router.push(`/books/${slug}`);
      } else {
        // Fallback vers l'ID si les données ne sont pas disponibles
        router.push(`/books/${result.bookId}`);
      }
    });
  };

  return (
    <Card className="border-border bg-card/90">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">Nouveau livre</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Renseignez les informations du livre pour l&apos;ajouter au catalogue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          aria-label="Formulaire de création de livre"
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              minLength={1}
              required
              placeholder="Ex. Le Nom du vent"
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">
              Auteur·rice <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author"
              name="author"
              type="text"
              minLength={1}
              required
              placeholder="Ex. Patrick Rothfuss"
              disabled={isPending}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicationYear">Année de publication</Label>
            <Input
              id="publicationYear"
              name="publicationYear"
              type="number"
              min="0"
              max={new Date().getFullYear() + 10}
              placeholder="Ex. 2007"
              disabled={isPending}
            />
          </div>

          <div className="space-y-4">
            <Label>Couverture du livre</Label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleCoverSourceChange("upload")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  coverSource === "upload"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                aria-pressed={coverSource === "upload"}
                aria-label="Importer une photo"
              >
                Importer une photo
              </button>
              <button
                type="button"
                onClick={() => handleCoverSourceChange("url")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  coverSource === "url"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                aria-pressed={coverSource === "url"}
                aria-label="Coller une URL"
              >
                Ou coller une URL
              </button>
            </div>

            {coverSource === "upload" ? (
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
                    id="coverFile"
                    name="coverFile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleCoverFileChange}
                    className="hidden"
                    disabled={isPending}
                    aria-label="Choisir une image pour la couverture"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileInputClick}
                    disabled={isPending}
                  >
                    {coverFile ? coverFile.name : "Choisir une photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Formats : JPEG, PNG, WebP. Max 5Mo.
                  </p>
                </div>
              </div>
            ) : (
              <Input
                id="coverUrl"
                name="coverUrl"
                type="url"
                placeholder="https://example.com/cover.jpg"
                disabled={isPending}
                aria-label="URL de la couverture"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Résumé</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={6}
              placeholder="Décrivez brièvement le livre..."
              disabled={isPending}
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            aria-live="polite"
            className="w-full"
          >
            {isPending ? "Création en cours..." : "Créer le livre"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookCreateForm;

