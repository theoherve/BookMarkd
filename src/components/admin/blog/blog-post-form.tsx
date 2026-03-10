"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBlogPost, updateBlogPost } from "@/server/actions/admin/blog";
import { Save, Eye } from "lucide-react";
import type { AdminBlogPost } from "@/types/admin";

type BlogPostFormProps = {
  post?: AdminBlogPost;
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const BlogPostForm = ({ post }: BlogPostFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [imageUrl, setImageUrl] = useState(post?.imageUrl ?? "");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    post?.status ?? "draft"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!post) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!title.trim() || !slug.trim() || !description.trim() || !body.trim()) {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }

    startTransition(async () => {
      if (post) {
        const result = await updateBlogPost(post.id, {
          title,
          slug,
          description,
          body,
          imageUrl: imageUrl || null,
          status,
        });
        if (!result.success) {
          setError(result.message);
          return;
        }
      } else {
        const result = await createBlogPost({
          title,
          slug,
          description,
          body,
          imageUrl: imageUrl || null,
          status: status === "archived" ? "draft" : status,
        });
        if (!result.success) {
          setError(result.message);
          return;
        }
      }
      router.push("/admin/blog");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main editor */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Titre de l'article"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug-de-l-article"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Courte description de l'article"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Contenu (Markdown) *</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-1 size-4" />{" "}
              {showPreview ? "Éditeur" : "Aperçu"}
            </Button>
          </div>
          {showPreview ? (
            <Card>
              <CardContent className="max-w-none pt-4">
                <div className="whitespace-pre-wrap text-sm">{body}</div>
              </CardContent>
            </Card>
          ) : (
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenu en markdown..."
              rows={20}
              className="font-mono text-sm"
            />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Publication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l&apos;image</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending}
            >
              <Save className="mr-1 size-4" />{" "}
              {isPending
                ? "Enregistrement..."
                : post
                  ? "Mettre à jour"
                  : "Créer"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
